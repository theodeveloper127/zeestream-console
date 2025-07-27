import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
// Import db from your existing Firebase config file
import { db } from '@/firebase/config';

// Importing your Movie and Comment interfaces (no Episode here)
import { Movie, Comment } from '@/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, Edit, Trash2, Film, Loader2, Star } from 'lucide-react'; // Removed Plus and Play icons
import { toast } from '@/hooks/use-toast';
import { MovieDialog } from '@/components/movies/MovieDialog'; // Reusing MovieDialog for series parts

export const EpisodesPage = () => {
  // State to hold movies that are marked as series parts (isSeries: true)
  const [seriesParts, setSeriesParts] = useState<Movie[]>([]);
  // State to hold unique relationship keys for the filter dropdown
  const [uniqueRelationships, setUniqueRelationships] = useState<{ id: string; name: string }[]>([]);
  const [filteredSeriesParts, setFilteredSeriesParts] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('all'); // Filter by relationship key

  const [selectedMovieForDialog, setSelectedMovieForDialog] = useState<Movie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);

  // No explicit Firebase initialization needed here, as 'db' is imported from '@/firebase/config'


  // Effect for fetching data on component mount and when filters change
  useEffect(() => {
    fetchSeriesParts();
  }, []); // Only fetch on initial mount

  // Effect for filtering series parts based on search term and selected relationship
  useEffect(() => {
    let filtered = seriesParts;

    // Filter by search term (name, description, relationship)
    if (searchTerm) {
      filtered = filtered.filter(movie =>
        movie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.relationship.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by selected relationship
    if (selectedRelationship !== 'all') {
      filtered = filtered.filter(movie => movie.relationship === selectedRelationship);
    }

    setFilteredSeriesParts(filtered);
  }, [seriesParts, searchTerm, selectedRelationship]);

  /**
   * Fetches all movies from Firebase and filters them to identify series parts.
   */
  const fetchSeriesParts = async () => {
    setLoading(true);
    try {
      // Use the 'movies' collection directly as per your existing setup
      const moviesRef = collection(db, 'movies');
      // Order by relationship first, then name, to group series parts logically
      const q = query(moviesRef, orderBy('relationship', 'asc'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      const allMoviesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadDate: doc.data().uploadDate instanceof Timestamp ? doc.data().uploadDate.toDate() : new Date(),
        releaseDate: doc.data().releaseDate instanceof Timestamp ? doc.data().releaseDate.toDate() : null,
        // Comments are part of the Movie interface but not processed/displayed on this page
        comments: doc.data().comments?.map((comment: any) => ({
          ...comment,
          timestamp: comment.timestamp instanceof Timestamp ? comment.timestamp.toDate() : new Date(),
        })) || [],
      })) as Movie[];

      // Filter for movies that are explicitly marked as series (isSeries: true)
      const seriesMovies = allMoviesData.filter(movie => movie.isSeries);
      setSeriesParts(seriesMovies); // This is the data source for the table

      // Collect unique relationship keys for the filter dropdown
      const relationshipsForFilter = Array.from(new Set(seriesMovies.map(movie => movie.relationship)))
        .map(key => ({ id: key, name: key })); // Use relationship key as both id and name for select

      setUniqueRelationships(relationshipsForFilter);

    } catch (error) {
      console.error('Error fetching series parts:', error);
      toast({
        title: "Error",
        description: "Failed to load series parts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles editing an existing movie (series part).
   * Opens the MovieDialog with the selected movie's data.
   */
  const handleEditSeriesPart = (movie: Movie) => {
    setSelectedMovieForDialog(movie);
    setIsMovieDialogOpen(true);
  };

  /**
   * Handles deleting a movie (series part) from Firebase.
   */
  const handleDeleteSeriesPart = async (movieId: string, movieName: string) => {
    try {
      // Use the 'movies' collection directly as per your existing setup
      const movieRef = doc(db, 'movies', movieId);
      await deleteDoc(movieRef);
      toast({
        title: "Success",
        description: `"${movieName}" deleted successfully.`,
      });
      fetchSeriesParts(); // Re-fetch to update the list
    } catch (error) {
      console.error('Error deleting series part:', error);
      toast({
        title: "Error",
        description: `Failed to delete series part: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Callback for when MovieDialog successfully adds/updates a movie
  const handleMovieDialogSuccess = () => {
    fetchSeriesParts(); // Re-fetch all series parts to update the list
    setIsMovieDialogOpen(false);
    setSelectedMovieForDialog(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Series Parts / Episodes</h1>
          <p className="text-muted-foreground">
            Manage individual movies that are part of a series or collection
          </p>
        </div>
        {/* Removed "Add Episode" button as per requirement */}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or series relationship..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Series</SelectItem>
                {uniqueRelationships.map((rel) => (
                  <SelectItem key={rel.id} value={rel.id}>
                    {rel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Series Parts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part / Episode Title</TableHead>
                <TableHead>Series Relationship</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSeriesParts.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.thumbnailUrl || 'https://placehold.co/64x40/E0E0E0/333333?text=No+Image'}
                        alt={movie.name}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{movie.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {movie.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {movie.relationship}
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
                    {movie.releaseDate ? movie.releaseDate.toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSeriesPart(movie)}>
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
                            <AlertDialogTitle>Delete Series Part</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{movie.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSeriesPart(movie.id, movie.name)}
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

      {filteredSeriesParts.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No series parts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedRelationship !== 'all'
                ? 'Try adjusting your search criteria or filter.'
                : 'No movies marked as series have been added yet.'}
            </p>
            <p className="text-sm text-muted-foreground">
              To add a series part, add a new movie and ensure "Is Series" is enabled.
            </p>
            {/* Removed "Add New Series Part" button from empty state */}
          </CardContent>
        </Card>
      )}

      {/* Reusing MovieDialog for adding/editing series parts */}
      <MovieDialog
        movie={selectedMovieForDialog}
        open={isMovieDialogOpen}
        onOpenChange={setIsMovieDialogOpen}
        onSuccess={handleMovieDialogSuccess}
      />
    </div>
  );
};
