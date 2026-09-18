interface TmdbMovie {
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
  genres: { name: string; movies: TmdbMovie[] }[];
  upcoming: TmdbMovie[];
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
