import { TMDB_API_KEY, TMDB_URL, OMDB_API_KEY } from "../config.js";
import type {
  HomeData,
  OmdbMovieData,
  TmdbGenreResponse,
  TmdbMovieDetails,
  TmdbMovieLogo,
  TmdbResponse,
  Provider,
} from "../../types/tmdb.ts";
import { getImage } from "astro:assets";
import { cached } from "./cache.ts";

interface TmdbErrorResponse {
  status_code: number;
  status_message: string;
  success: false;
}

const genreMap = ["Action", "Adventure", "Romance", "Horror", "Drama"];
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

async function fetchMoviePages(endpoint: string, pageCount = 2): Promise<TmdbResponse["results"]> {
  const responses = await Promise.all(Array.from({ length: pageCount }, (_, index) => fetch(`${endpoint}&page=${index + 1}`)));

  const pages = await Promise.all(responses.map((response) => response.json() as Promise<TmdbResponse | TmdbErrorResponse>));

  pages.forEach((page) => {
    if (!("results" in page)) {
      throw new Error(`Erro na TMDb: ${page.status_message}`);
    }
  });

  return (pages as TmdbResponse[]).flatMap(({ results }) => results);
}

async function doFetchHomeData(): Promise<HomeData> {
  const [genresRes, upcomingData, recentMoviesData, movies] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`),
    fetchMoviePages(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}`),
    fetchMoviePages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}`),
    fetchMoviePages(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`),
  ]);

  const { genres } = (await genresRes.json()) as TmdbGenreResponse;

  const popularMovie = movies.find((movie) => movie.backdrop_path && !movie.adult && movie.vote_average >= 6 && movie.vote_count >= 100)!;
  const recentMovies = recentMoviesData.map(({ id, title, poster_path }) => ({ id, title, poster_path }));
  const upcomingMovies = upcomingData.map(({ id, title, poster_path }) => ({ id, title, poster_path }));

  const genreMovies = await Promise.all(
    genres
      .filter((genre) => genreMap.includes(genre.name))
      .map(async (genre) => {
        const results = await fetchMoviePages(
          `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genre.id}`,
        );

        return {
          title: genre.name,
          movies: results.map(({ id, title, poster_path }) => ({
            id,
            title,
            poster_path,
          })),
        };
      }),
  );

  return { popularMovie, genres: genreMovies, upcomingMovies, recentMovies };
}

export async function fetchHomeData(): Promise<HomeData> {
  return cached("home", doFetchHomeData, DAY);
}

export async function backdropMovieOptimized(path: string | null) {
  const backdropUrl = `https://image.tmdb.org/t/p/w1280${path}`;
  return getImage({
    src: backdropUrl,
    format: "webp",
    quality: 80,
    width: 1280,
    height: 720,
  });
}

export async function movieComplements(id: number) {
  const [providersRes, logoRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${TMDB_API_KEY}&language=en-US`),
    fetch(`https://api.themoviedb.org/3/movie/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`),
  ]);

  const providersData = await providersRes.json();
  const logoRaw = await logoRes.json();

  const results = providersData.results ?? {};
  const country = results.US ?? results.BR ?? {};
  const providers: Provider[] = (country.flatrate ?? []).slice(0, 3);

  const streamings = providers.map((p) => {
    return { logo: p.logo_path, id: p.provider_id, name: p.provider_name };
  });

  const logo = logoRaw.logos?.find((l: any) => l.iso_639_1 === "en") ?? logoRaw.logos?.[0];
  const logoUrl = logo ? logo.file_path : null;

  return {
    streamings,
    logoData: { url: logoUrl, width: logo?.width ?? null, height: logo?.height ?? null },
  };
}

async function fetchMovieMain(id: number): Promise<TmdbMovieDetails> {
  const response = await fetch(`${TMDB_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,watch/providers`);
  return response.json();
}

async function fetchCollection(collectionId: number) {
  const response = await fetch(`${TMDB_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}`);
  return response.json();
}

async function fetchMovieLogo(id: number): Promise<TmdbMovieLogo | null> {
  const response = await fetch(`${TMDB_URL}/movie/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`);
  const data = (await response.json()) as { logos?: TmdbMovieLogo[] };
  const logo = data.logos?.find(({ iso_639_1 }) => iso_639_1 === "en") ?? data.logos?.[0];

  return logo ?? null;
}

async function fetchExternalRatings(imdbId: string): Promise<OmdbMovieData | null> {
  if (!OMDB_API_KEY) {
    console.error("OMDb API key não configurada.");
    return null;
  }

  try {
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`);
    const data = (await response.json()) as OmdbMovieData;

    if (!response.ok || data.Response === "False") {
      console.error(`OMDb rejeitou a requisição: ${data.Error ?? response.statusText}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error("OMDb falhou:", error);
    return null;
  }
}

function findPreviousMovie(collection: any, movie: any) {
  if (!collection) return null;

  const releasedParts = collection.parts
    .filter((part: any) => part.release_date)
    .sort((a: any, b: any) => a.release_date.localeCompare(b.release_date));

  const currentIndex = releasedParts.findIndex((part: any) => part.id === movie.id);
  return currentIndex > 0 ? releasedParts[currentIndex - 1] : null;
}

async function doFetchMovieDetails(id: number) {
  const [movie, logo] = await Promise.all([fetchMovieMain(id), fetchMovieLogo(id)]);
  const movieWithLogo = { ...movie, logo };

  const [collection, externalRatings] = await Promise.all([
    movieWithLogo.belongs_to_collection ? fetchCollection(movieWithLogo.belongs_to_collection.id) : null,
    movieWithLogo.imdb_id ? fetchExternalRatings(movieWithLogo.imdb_id) : null,
  ]);

  return { movie: movieWithLogo, previousMovie: findPreviousMovie(collection, movieWithLogo), externalRatings };
}

export async function fetchMovieDetails(id: number) {
  return cached(`movie:${id}`, () => doFetchMovieDetails(id), WEEK);
}
