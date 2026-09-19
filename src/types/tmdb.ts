export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  adult: boolean;
  release_date: string;
  genre_ids: number[];
  media_type: string;
}

export type TmdbMoviePreview = Pick<TmdbMovie, "id" | "poster_path" | "title">;

export interface MovieRowData {
  title: string;
  movies: TmdbMoviePreview[];
}

export interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreResponse {
  genres: TmdbGenre[];
}

export interface HomeData {
  popularMovie: TmdbMovie;
  genres: MovieRowData[];
  upcomingMovies: TmdbMoviePreview[];
  recentMovies: TmdbMoviePreview[];
}

export interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface Streaming {
  logo: string;
  id: number;
  name: string;
}
