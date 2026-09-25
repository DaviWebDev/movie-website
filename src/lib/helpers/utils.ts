import type {
  FilteredExternalRatings,
  FilteredMovieData,
  HomeData,
  OmdbMovieData,
  TmdbMovieDetails,
  TmdbMoviePreview,
} from "../../types/tmdb";

export function filterUniqueMovies(movies: TmdbMoviePreview[], displayedMovieIds: Set<number>) {
  return movies.filter((movie) => {
    if (displayedMovieIds.has(movie.id)) return false;

    displayedMovieIds.add(movie.id);
    return true;
  });
}

const createSlug = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function createSlugMap(movies: { id: number; title: string }[]): Map<number, string> {
  const titleSlugs = movies.map(({ id, title }) => ({ id, titleSlug: createSlug(title) }));

  const slugCounts = new Map<string, number>();
  titleSlugs.forEach(({ titleSlug }) => {
    slugCounts.set(titleSlug, (slugCounts.get(titleSlug) ?? 0) + 1);
  });

  return new Map(
    titleSlugs.map(({ id, titleSlug }): [number, string] => {
      if (!titleSlug) return [id, String(id)]; // sem nome: usa o id
      const isDuplicate = slugCounts.get(titleSlug)! > 1;
      return [id, isDuplicate ? `${titleSlug}-${id}` : titleSlug];
    }),
  );
}

export function getHomeMovies({ popularMovie: popular, recentMovies: recent, upcomingMovies: upcoming, genres }: HomeData) {
  const allDataMovies = [popular, ...recent, ...upcoming, ...genres.flatMap((genre) => genre.movies)];
  return [...new Map(allDataMovies.map((movie) => [movie.id, movie])).values()];
}

export function filterMovieDetails({
  movie,
  previousMovie,
  externalRatings,
}: {
  movie: TmdbMovieDetails;
  previousMovie: TmdbMoviePreview | null;
  externalRatings: OmdbMovieData | null;
}): {
  movie: FilteredMovieData;
  previousMovie: { title: string } | null;
  externalRatings: FilteredExternalRatings | null;
} {
  const cast = (movie.credits?.cast ?? []).map(({ id, name, character, profile_path }) => ({
    id,
    name,
    role: character,
    photo: profile_path,
  }));

  const director = (movie.credits?.crew ?? [])
    .filter(({ job }) => job === "Director")
    .map(({ id, name, profile_path }) => ({ id, name, photo: profile_path }));

  const countryProviders = movie["watch/providers"]?.results?.US;
  const providers = [...(countryProviders?.flatrate ?? []), ...(countryProviders?.rent ?? []), ...(countryProviders?.buy ?? [])];
  const uniqueProviders = [...new Map(providers.map((provider) => [provider.provider_id, provider])).values()];

  const trailer =
    movie.videos?.results?.find(({ site, type, official }) => site === "YouTube" && type === "Trailer" && official !== false) ?? null;

  return {
    movie: {
      backdrop_path: movie.backdrop_path,
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      tagline: movie.tagline,
      release_date: movie.release_date,
      genres: movie.genres,
      cast,
      director,
      providers: uniqueProviders,
      trailer,
      logo: movie.logo
        ? {
            path: movie.logo.file_path,
            width: movie.logo.width,
            height: movie.logo.height,
          }
        : null,
    },
    previousMovie: previousMovie ? { title: previousMovie.title } : null,
    externalRatings: externalRatings
      ? {
          released: externalRatings.Released ?? null,
          ratings: externalRatings.Ratings ?? [],
        }
      : null,
  };
}
