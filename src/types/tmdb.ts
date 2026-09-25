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
  display_priority: number;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  tagline: string | null;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
    crew?: Array<{ id: number; name: string; job: string; profile_path: string | null }>;
  };
  videos?: {
    results?: Array<{ key: string; name: string; site: string; type: string; official?: boolean }>;
  };
  "watch/providers"?: {
    results?: Record<string, { flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[] }>;
  };
  belongs_to_collection?: { id: number } | null;
  imdb_id?: string | null;
  logo?: TmdbMovieLogo | null;
}

export interface TmdbMovieLogo {
  file_path: string;
  width: number;
  height: number;
  iso_639_1: string | null;
}

export interface OmdbRatings {
  Source: string;
  Value: string;
}

export interface OmdbMovieData {
  Released?: string;
  Ratings?: OmdbRatings[];
  Response?: string;
  Error?: string;
}

export interface FilteredMovieData {
  backdrop_path: string | null;
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  tagline: string | null;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  cast: Array<{ id: number; name: string; role: string; photo: string | null }>;
  director: Array<{ id: number; name: string; photo: string | null }>;
  providers: Provider[];
  trailer: { key: string; name: string; site: string; type: string; official?: boolean } | null;
  logo: { path: string; width: number; height: number } | null;
}

export interface FilteredExternalRatings {
  released: string | null;
  ratings: OmdbRatings[];
}
