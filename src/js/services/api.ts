import { API_KEY } from "../config";
import type { HomeData, TmdbGenreResponse, TmdbResponse, Provider, Streaming } from "../../types/tmdb";
import { getImage } from "astro:assets";

export async function fetchHomeData(): Promise<HomeData> {
  const [genresRes, upcomingRes, ...pages] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`),
    fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`),
    ...[1, 2, 3, 4, 5].map((page) => fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&page=${page}`)),
  ]);

  const { genres } = (await genresRes.json()) as TmdbGenreResponse;
  const { results: upcoming } = (await upcomingRes.json()) as TmdbResponse;
  const movieData = await Promise.all(pages.map((r) => r.json() as Promise<TmdbResponse>));
  const movies = movieData.flatMap((d) => d.results);

  const popularMovie = movies.find((movie) => movie.backdrop_path && !movie.adult && movie.vote_average >= 6 && movie.vote_count >= 100)!;

  const genreMovies = genres
    .map((genre) => ({
      name: genre.name,
      movies: movies.filter((movie) => movie.genre_ids?.includes(genre.id)),
    }))
    .filter((genre) => genre.movies.length > 0);

  return { popularMovie, genres: genreMovies, upcoming };
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
