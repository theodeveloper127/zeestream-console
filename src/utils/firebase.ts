import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase/config'; // Assuming db and storage are initialized here
import { Movie, Comment, UserProfile, DashboardStats } from '@/types'; // Removed Episode as it's not used

// Movie operations
export const getMovies = async (): Promise<Movie[]> => {
  const moviesRef = collection(db, 'movies');
  const q = query(moviesRef, orderBy('uploadDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadDate: doc.data().uploadDate?.toDate() || new Date(),
    releaseDate: doc.data().releaseDate?.toDate() || null,
    comments: doc.data().comments?.map((comment: any) => ({
      ...comment,
      timestamp: comment.timestamp?.toDate() || new Date(),
    })) || [],
  })) as Movie[];
};

export const addMovie = async (movieData: Omit<Movie, 'id' | 'uploadDate'>): Promise<string> => {
  const moviesRef = collection(db, 'movies');
  const docRef = await addDoc(moviesRef, {
    ...movieData,
    uploadDate: serverTimestamp(),
    releaseDate: movieData.releaseDate ? Timestamp.fromDate(movieData.releaseDate) : null,
  });
  return docRef.id;
};

export const updateMovie = async (id: string, movieData: Partial<Movie>): Promise<void> => {
  const movieRef = doc(db, 'movies', id);
  const updateData = { ...movieData };
  if (updateData.releaseDate) {
    updateData.releaseDate = Timestamp.fromDate(updateData.releaseDate) as any;
  } else if (updateData.releaseDate === null) { // Handle explicit null for clearing date
    updateData.releaseDate = null;
  }
  await updateDoc(movieRef, updateData);
};

export const deleteMovie = async (id: string): Promise<void> => {
  const movieRef = doc(db, 'movies', id);
  await deleteDoc(movieRef);
};

// User operations
export const getUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as UserProfile[];
};

export const deleteUser = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
};

// Comment operations
export const deleteComment = async (movieId: string, commentId: string): Promise<void> => {
  const movieRef = doc(db, 'movies', movieId);
  const movieDoc = await getDoc(movieRef);

  if (movieDoc.exists()) {
    const movieData = movieDoc.data() as Movie;
    const updatedComments = movieData.comments.filter(comment => comment.id !== commentId);
    await updateDoc(movieRef, { comments: updatedComments });
  }
};

// File upload operations
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// Dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [moviesSnapshot, usersSnapshot] = await Promise.all([
    getDocs(collection(db, 'movies')),
    getDocs(collection(db, 'users')),
  ]);

  const movies = moviesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadDate: doc.data().uploadDate?.toDate() || new Date(),
    releaseDate: doc.data().releaseDate?.toDate() || null,
    comments: doc.data().comments?.map((comment: any) => ({
      ...comment,
      timestamp: comment.timestamp?.toDate() || new Date(),
    })) || [],
  })) as Movie[];

  const totalMovies = movies.length;

  // Calculate total episodes: count movies where isSeries is true
  const seriesEpisodes = movies.filter(movie => movie.isSeries);
  const totalEpisodes = seriesEpisodes.length;

  // Calculate total series: count unique 'relationship' values among series episodes
  const uniqueSeriesRelationships = new Set<string>();
  seriesEpisodes.forEach(episode => {
    if (episode.relationship) { 
      uniqueSeriesRelationships.add(episode.relationship);
    }
  });
  const totalSeries = uniqueSeriesRelationships.size;

  // Calculate total comments: sum of comments array length from each movie
  const totalComments = movies.reduce((acc, movie) => acc + (movie.comments?.length || 0), 0);

  // Get recent movies (last 5)
  const recentMovies = movies
    .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
    .slice(0, 5);

  return {
    totalMovies,
    totalSeries,
    totalEpisodes,
    totalUsers: usersSnapshot.size,
    totalComments,
    recentMovies,
  };
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};
