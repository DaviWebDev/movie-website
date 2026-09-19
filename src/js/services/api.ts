import { API_KEY } from "../config";
import type { HomeData, TmdbGenreResponse, TmdbResponse, Provider, Streaming } from "../../types/tmdb";
import { getImage } from "astro:assets";

const genreMap = ["Action", "Adventure", "Romance", "Horror", "Drama"];

async function fetchMoviePages(endpoint: string, pageCount = 2): Promise<TmdbResponse["results"]> {
  const responses = await Promise.all(Array.from({ length: pageCount }, (_, index) => fetch(`${endpoint}&page=${index + 1}`)));

  const pages = await Promise.all(responses.map((response) => response.json() as Promise<TmdbResponse>));

  return pages.flatMap(({ results }) => results);
}

export async function fetchHomeData(): Promise<HomeData> {
  const [genresRes, upcomingData, recentMoviesData, movies] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`),
    fetchMoviePages(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`),
    fetchMoviePages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}`),
    fetchMoviePages(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
  ]);

  const { genres } = (await genresRes.json()) as TmdbGenreResponse;

  const popularMovie = movies.find((movie) => movie.backdrop_path && !movie.adult && movie.vote_average >= 6 && movie.vote_count >= 100)!;
  const recentMovies = recentMoviesData.map(({ id, title, poster_path }) => ({ id, title, poster_path }));
  const upcomingMovies = upcomingData.map(({ id, title, poster_path }) => ({ id, title, poster_path }));

  const genreMovies = await Promise.all(
    genres
      .filter((genre) => genreMap.includes(genre.name))
      .map(async (genre) => {
        const results = await fetchMoviePages(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genre.id}`);

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
    fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${API_KEY}&language=en-US`),
    fetch(`https://api.themoviedb.org/3/movie/${id}/images?api_key=${API_KEY}&include_image_language=en,null`),
  ]);

  const providersData = await providersRes.json();
  const logoRaw = await logoRes.json();

  const results = providersData.results ?? {};
  const country = results.US ?? results.BR ?? {};
  const providers: Provider[] = (country.flatrate ?? []).slice(0, 3);

  const streamings: Streaming[] = providers.map((p) => {
    return { logo: p.logo_path, id: p.provider_id, name: p.provider_name };
  });

  const logo = logoRaw.logos?.find((l: any) => l.iso_639_1 === "en") ?? logoRaw.logos?.[0];
  const logoUrl = logo ? logo.file_path : null;

  return {
    streamings,
    logoData: { url: logoUrl, width: logo?.width ?? null, height: logo?.height ?? null },
  };
}
