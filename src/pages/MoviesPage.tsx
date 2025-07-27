import { useEffect, useState } from 'react';
import axios from 'axios'; // Import axios for backend API calls
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  addDoc, // Added for batch insert to Firebase
} from 'firebase/firestore';
// Import db from your existing Firebase config file
import { db } from '@/firebase/config';

// Importing interfaces from your central types file
import { Movie } from '@/types'; // Assuming Comment is not directly used in MoviesPage for display

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox'; // For selecting scrapped movies
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Film,
  Loader2,
  UploadCloud, // New icon for batch insert
  Star // Added Star import
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MovieDialog } from '@/components/movies/MovieDialog'; // For Firebase movie add/edit
import { ScrappedMovieDialog } from '@/components/movies/ScrappedMovieDialog'; // Placeholder for new dialog

// Define the backend API base URL for scrapped movies
const API_SCRAPPED_MOVIES_BASE_URL = import.meta.env.VITE_API_SCRAPPED_MOVIES_URL;

export const MoviesPage = () => {
  // State for Firebase-managed movies
  const [firebaseMovies, setFirebaseMovies] = useState<Movie[]>([]);
  const [filteredFirebaseMovies, setFilteredFirebaseMovies] = useState<Movie[]>([]);
  const [loadingFirebaseMovies, setLoadingFirebaseMovies] = useState(true);
  const [selectedFirebaseMovie, setSelectedFirebaseMovie] = useState<Movie | null>(null);
  const [isFirebaseMovieDialogOpen, setIsFirebaseMovieDialogOpen] = useState(false);

  // State for Scrapped (backend) movies
  const [scrappedMovies, setScrappedMovies] = useState<Movie[]>([]);
  const [filteredScrappedMovies, setFilteredScrappedMovies] = useState<Movie[]>([]);
  const [loadingScrappedMovies, setLoadingScrappedMovies] = useState(true);
  const [selectedScrappedMovie, setSelectedScrappedMovie] = useState<Movie | null>(null);
  const [isScrappedMovieDialogOpen, setIsScrappedMovieDialogOpen] = useState(false);
  const [selectedScrappedMovieIds, setSelectedScrappedMovieIds] = useState<Set<string>>(new Set());
  const [isBatchInserting, setIsBatchInserting] = useState(false);


  const [searchTermFirebase, setSearchTermFirebase] = useState('');
  const [searchTermScrapped, setSearchTermScrapped] = useState('');
  // Removed viewModeFirebase and viewModeScrapped states

  // New state to manage active tab: 'firebase' or 'scrapped'
  const [activeTab, setActiveTab] = useState<'firebase' | 'scrapped'>('firebase');


  useEffect(() => {
    fetchFirebaseMovies();
    fetchScrappedMovies();
  }, []); // Initial fetch on component mount

  // Effect for filtering Firebase movies
  useEffect(() => {
    const filtered = firebaseMovies.filter(movie =>
      movie.name.toLowerCase().includes(searchTermFirebase.toLowerCase()) ||
      movie.category.toLowerCase().includes(searchTermFirebase.toLowerCase()) ||
      movie.type.toLowerCase().includes(searchTermFirebase.toLowerCase())
    );
    setFilteredFirebaseMovies(filtered);
  }, [firebaseMovies, searchTermFirebase]);

  // Effect for filtering Scrapped movies
  useEffect(() => {
    const filtered = scrappedMovies.filter(movie =>
      movie.name.toLowerCase().includes(searchTermScrapped.toLowerCase()) ||
      movie.category.toLowerCase().includes(searchTermScrapped.toLowerCase()) ||
      movie.type.toLowerCase().includes(searchTermScrapped.toLowerCase())
    );
    setFilteredScrappedMovies(filtered);
  }, [scrappedMovies, searchTermScrapped]);


  /**
   * Fetches movies from Firebase (My App Movies).
   */
  const fetchFirebaseMovies = async () => {
    setLoadingFirebaseMovies(true);
    try {
      const moviesRef = collection(db, 'movies');
      const q = query(moviesRef, orderBy('uploadDate', 'desc'));
      const snapshot = await getDocs(q);

      const moviesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadDate: doc.data().uploadDate instanceof Timestamp ? doc.data().uploadDate.toDate() : new Date(),
        releaseDate: doc.data().releaseDate instanceof Timestamp ? doc.data().releaseDate.toDate() : null,
        comments: doc.data().comments?.map((comment: any) => ({
          ...comment,
          timestamp: comment.timestamp instanceof Timestamp ? comment.timestamp.toDate() : new Date(),
        })) || [],
      })) as Movie[];
      setFirebaseMovies(moviesData);
    } catch (error) {
      console.error('Error fetching Firebase movies:', error);
      toast({
        title: "Error",
        description: "Failed to load My App movies",
        variant: "destructive",
      });
    } finally {
      setLoadingFirebaseMovies(false);
    }
  };

  /**
   * Fetches movies from the backend (Scrapped Movies).
   */
  const fetchScrappedMovies = async () => {
    setLoadingScrappedMovies(true);
    try {
      if (!API_SCRAPPED_MOVIES_BASE_URL) {
        throw new Error("VITE_API_SCRAPPED_MOVIES_URL is not defined in environment variables.");
      }
      const response = await axios.get<Movie[]>(`${API_SCRAPPED_MOVIES_BASE_URL}/movies`);
      // Ensure dates are converted from string to Date objects if they come as strings from backend
      const scrappedMoviesData = response.data.map(movie => ({
        ...movie,
        uploadDate: movie.uploadDate ? new Date(movie.uploadDate) : new Date(),
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : undefined,
        comments: movie.comments?.map(comment => ({
          ...comment,
          timestamp: new Date(comment.timestamp),
        })) || [],
      }));
      setScrappedMovies(scrappedMoviesData);
    } catch (error) {
      console.error('Error fetching scrapped movies:', error);
      let errorMessage = "Failed to load scrapped movies.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Failed to load scrapped movies: ${error.response.status} - ${error.response.data.message || error.message}`;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingScrappedMovies(false);
    }
  };

  /**
   * Handles the deletion of a Firebase movie.
   */
  const handleDeleteFirebaseMovie = async (movieId: string) => {
    try {
      const movieRef = doc(db, 'movies', movieId);
      await deleteDoc(movieRef);
      setFirebaseMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
      toast({
        title: "Success",
        description: "My App movie deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting Firebase movie:', error);
      toast({
        title: "Error",
        description: "Failed to delete My App movie",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles the deletion of a Scrapped movie from the backend.
   */
  const handleDeleteScrappedMovie = async (movieId: string) => {
    try {
      if (!API_SCRAPPED_MOVIES_BASE_URL) {
        throw new Error("VITE_API_SCRAPPED_MOVIES_URL is not defined.");
      }
      await axios.delete(`${API_SCRAPPED_MOVIES_BASE_URL}/movies/${movieId}`);
      setScrappedMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
      toast({
        title: "Success",
        description: "Scrapped movie deleted successfully from backend",
      });
    } catch (error) {
      console.error('Error deleting scrapped movie:', error);
      let errorMessage = "Failed to delete scrapped movie from backend.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Failed to delete scrapped movie: ${error.response.status} - ${error.response.data.message || error.message}`;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAddFirebaseMovie = () => {
    setSelectedFirebaseMovie(null);
    setIsFirebaseMovieDialogOpen(true);
  };

  const handleEditFirebaseMovie = (movie: Movie) => {
    setSelectedFirebaseMovie(movie);
    setIsFirebaseMovieDialogOpen(true);
  };

  const handleEditScrappedMovie = (movie: Movie) => {
    setSelectedScrappedMovie(movie);
    setIsScrappedMovieDialogOpen(true);
  };

  // Callback for when Firebase MovieDialog successfully adds/updates a movie
  const handleFirebaseMovieUpdate = () => {
    fetchFirebaseMovies(); // Re-fetch all Firebase movies
    setIsFirebaseMovieDialogOpen(false);
    setSelectedFirebaseMovie(null);
  };

  // Callback for when Scrapped MovieDialog successfully updates a movie
  const handleScrappedMovieUpdate = () => {
    fetchScrappedMovies(); // Re-fetch all scrapped movies
    setIsScrappedMovieDialogOpen(false);
    setSelectedScrappedMovie(null);
  };

  /**
   * Toggles selection of a scrapped movie for batch insertion.
   */
  const handleToggleScrappedMovieSelection = (movieId: string, isChecked: boolean) => {
    setSelectedScrappedMovieIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(movieId);
      } else {
        newSet.delete(movieId);
      }
      return newSet;
    });
  };

  /**
   * Inserts selected scrapped movies into Firebase and deletes them from backend.
   */
  const handleInsertSelectedScrappedMoviesToFirebase = async () => {
    if (selectedScrappedMovieIds.size === 0) {
      toast({
        title: "Info",
        description: "No movies selected for insertion.",
        variant: "default",
      });
      return;
    }

    setIsBatchInserting(true);
    let successCount = 0;
    let failCount = 0;
    const moviesToInsert = scrappedMovies.filter(movie => selectedScrappedMovieIds.has(movie.id));

    for (const movie of moviesToInsert) {
      try {
        // Prepare movie data for Firebase (remove backend-specific fields if any, ensure dates are Timestamp)
        const firebaseMovieData = {
          ...movie,
          // Remove ID as Firebase will generate a new one
          id: undefined,
          uploadDate: Timestamp.fromDate(movie.uploadDate || new Date()),
          releaseDate: movie.releaseDate ? Timestamp.fromDate(movie.releaseDate) : null,
          // Ensure comments are properly structured for Firebase
          comments: movie.comments?.map(comment => ({
            ...comment,
            timestamp: Timestamp.fromDate(comment.timestamp || new Date()),
          })) || [],
        };
        const moviesRef = collection(db, 'movies');
        await addDoc(moviesRef, firebaseMovieData);
        successCount++;

        // --- NEW: Delete from backend (MongoDB) after successful Firebase insertion ---
        try {
          if (!API_SCRAPPED_MOVIES_BASE_URL) {
            throw new Error("VITE_API_SCRAPPED_MOVIES_URL is not defined.");
          }
          await axios.delete(`${API_SCRAPPED_MOVIES_BASE_URL}/movies/${movie.id}`);
          // Update scrappedMovies state immediately after successful deletion from backend
          setScrappedMovies(prev => prev.filter(m => m.id !== movie.id));
        } catch (deleteError) {
          console.error(`Failed to delete movie ${movie.name} from backend after Firebase insertion:`, deleteError);
          toast({
            title: "Warning",
            description: `Movie "${movie.name}" inserted into My App, but failed to delete from backend.`,
            variant: "warning",
          });
        }
        // --- END NEW ---

      } catch (error) {
        console.error(`Failed to insert movie ${movie.name} to Firebase:`, error);
        failCount++;
      }
    }

    setIsBatchInserting(false);
    setSelectedScrappedMovieIds(new Set()); // Clear selection after attempt
    fetchFirebaseMovies(); // Refresh Firebase movies list
    // fetchScrappedMovies(); // No need to re-fetch all scrapped movies, as we update state directly on deletion
    toast({
      title: "Batch Insertion Complete",
      description: `${successCount} movies inserted, ${failCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive",
    });
  };

  // Display loading state for both sections
  if (loadingFirebaseMovies || loadingScrappedMovies) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant={activeTab === 'firebase' ? 'default' : 'outline'}
          onClick={() => setActiveTab('firebase')}
          className="px-8 py-2 text-lg"
        >
          My App Movies
        </Button>
        <Button
          variant={activeTab === 'scrapped' ? 'default' : 'outline'}
          onClick={() => setActiveTab('scrapped')}
          className="px-8 py-2 text-lg"
        >
          Scrapped Movies
        </Button>
      </div>

      {activeTab === 'firebase' && (
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My App Movies</h1>
              <p className="text-muted-foreground">
                Manage movies stored in your Firebase database
              </p>
            </div>
            <Button onClick={handleAddFirebaseMovie} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Movie
            </Button>
          </div>

          {/* Search for Firebase Movies */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Search My App Movies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search My App movies..."
                    value={searchTermFirebase}
                    onChange={(e) => setSearchTermFirebase(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Firebase Movies Display (Table View Only) */}
          {filteredFirebaseMovies.length === 0 && !loadingFirebaseMovies ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No My App movies found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTermFirebase ? 'Try adjusting your search criteria' : 'Add your first movie to Firebase'}
                </p>
                {!searchTermFirebase && (
                  <Button onClick={handleAddFirebaseMovie}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Movie
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Movie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFirebaseMovies.map((movie) => (
                      <TableRow key={movie.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={movie.thumbnailUrl || 'https://placehold.co/48x64/E0E0E0/333333?text=No+Image'}
                              alt={movie.name}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{movie.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {movie.isSeries ? 'Series' : 'Movie'}
                                {movie.isSeries && movie.relationship && ` • ${movie.relationship}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={movie.type === 'original' ? 'default' : 'secondary'}>
                            {movie.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{movie.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {movie.rating}/10
                          </div>
                        </TableCell>
                        <TableCell>
                          {movie.comingSoon ? (
                            <Badge variant="outline">Coming Soon</Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {movie.uploadDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFirebaseMovie(movie)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{movie.name}" from My App movies? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteFirebaseMovie(movie.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {activeTab === 'scrapped' && (
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Scrapped Movies</h2>
              <p className="text-muted-foreground">
                Movies fetched from external sources
              </p>
            </div>
            <Button
              onClick={handleInsertSelectedScrappedMoviesToFirebase}
              disabled={selectedScrappedMovieIds.size === 0 || isBatchInserting}
              className="gap-2"
            >
              {isBatchInserting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Insert Selected to My App ({selectedScrappedMovieIds.size})
            </Button>
          </div>

          {/* Search for Scrapped Movies */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Search Scrapped Movies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search scrapped movies..."
                    value={searchTermScrapped}
                    onChange={(e) => setSearchTermScrapped(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scrapped Movies Display (Table View Only) */}
          {filteredScrappedMovies.length === 0 && !loadingScrappedMovies ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No scrapped movies found</h3>
                <p className="text-muted-foreground">
                  {searchTermScrapped ? 'Try adjusting your search criteria' : 'Scrapped movies will appear here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Movie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScrappedMovies.map((movie) => (
                      <TableRow key={movie.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedScrappedMovieIds.has(movie.id)}
                            onCheckedChange={(checked) =>
                              handleToggleScrappedMovieSelection(movie.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={movie.thumbnailUrl || 'https://placehold.co/48x64/E0E0E0/333333?text=No+Image'}
                              alt={movie.name}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{movie.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {movie.isSeries ? 'Series' : 'Movie'}
                                {movie.isSeries && movie.relationship && ` • ${movie.relationship}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={movie.type === 'original' ? 'default' : 'secondary'}>
                            {movie.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{movie.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {movie.rating}/10
                          </div>
                        </TableCell>
                        <TableCell>
                          {movie.comingSoon ? (
                            <Badge variant="outline">Coming Soon</Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {movie.uploadDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditScrappedMovie(movie)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Scrapped Movie</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{movie.name}" from the backend? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteScrappedMovie(movie.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* MovieDialog for Firebase Movies */}
      <MovieDialog
        movie={selectedFirebaseMovie}
        open={isFirebaseMovieDialogOpen}
        onOpenChange={setIsFirebaseMovieDialogOpen}
        onSuccess={handleFirebaseMovieUpdate}
      />

      {/* ScrappedMovieDialog for Backend Movies */}
      <ScrappedMovieDialog
        movie={selectedScrappedMovie}
        open={isScrappedMovieDialogOpen}
        onOpenChange={setIsScrappedMovieDialogOpen}
        onSuccess={handleScrappedMovieUpdate}
      />
    </div>
  );
};
