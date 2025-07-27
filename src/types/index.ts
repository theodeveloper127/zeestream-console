export interface Movie {
  id: string;
  name: string; 
  slug: string;
  thumbnailUrl: string;
  type: 'original' | 'translated';
  category: string;
  likes: number;
  comments: Comment[];
  rating: number;
  uploadDate: Date;
  description: string;
  trailerUrl: string;
  isSeries: boolean;
  relationship: string; 
  comingSoon: boolean;
  releaseDate?: Date;
  translator?: string;
  watchUrl: string;
  downloadUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  likedMovies: string[];
  role:string;
}

export interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalEpisodes: number;
  totalUsers: number;
  totalComments: number;
  recentMovies: Movie[];
}