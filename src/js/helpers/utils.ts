import type { TmdbMoviePreview } from "../../types/tmdb";

export function filterUniqueMovies(movies: TmdbMoviePreview[], displayedMovieIds: Set<number>) {
  return movies.filter((movie) => {
    if (displayedMovieIds.has(movie.id)) return false;

    displayedMovieIds.add(movie.id);
    return true;
  });
}
