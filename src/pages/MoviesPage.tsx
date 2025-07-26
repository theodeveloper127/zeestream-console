import { useEffect, useState } from 'react';
import { getMovies, deleteMovie } from '@/utils/firebase';
import { Movie } from '@/types';
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
  Eye,
  Loader2,
  Calendar,
  Star
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MovieDialog } from '@/components/movies/MovieDialog';

export const MoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    const filtered = movies.filter(movie =>
      movie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMovies(filtered);
  }, [movies, searchTerm]);

  const fetchMovies = async () => {
    try {
      const moviesData = await getMovies();
      setMovies(moviesData);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast({
        title: "Error",
        description: "Failed to load movies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    try {
      await deleteMovie(movieId);
      setMovies(movies.filter(movie => movie.id !== movieId));
      toast({
        title: "Success",
        description: "Movie deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting movie:', error);
      toast({
        title: "Error",
        description: "Failed to delete movie",
        variant: "destructive",
      });
    }
  };

  const handleAddMovie = () => {
    setSelectedMovie(null);
    setIsDialogOpen(true);
  };

  const handleEditMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsDialogOpen(true);
  };

  const handleMovieUpdate = () => {
    fetchMovies();
    setIsDialogOpen(false);
    setSelectedMovie(null);
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
          <h1 className="text-3xl font-bold text-foreground">Movies</h1>
          <p className="text-muted-foreground">
            Manage your movie collection
          </p>
        </div>
        <Button onClick={handleAddMovie} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Movie
        </Button>
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
                placeholder="Search movies by name, category, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movies Display */}
      {viewMode === 'table' ? (
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
                {filteredMovies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.thumbnailUrl || '/placeholder.svg'}
                          alt={movie.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{movie.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {movie.isSeries ? 'Series' : 'Movie'}
                            {movie.isSeries && movie.parts && ` • ${movie.parts.length} episodes`}
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
                          onClick={() => handleEditMovie(movie)}
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
                                Are you sure you want to delete "{movie.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMovie(movie.id)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <Card key={movie.id} className="shadow-card hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                <img
                  src={movie.thumbnailUrl || '/placeholder.svg'}
                  alt={movie.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={movie.type === 'original' ? 'default' : 'secondary'}>
                    {movie.type}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{movie.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{movie.category}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{movie.rating}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMovie(movie)}
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
                            Are you sure you want to delete "{movie.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMovie(movie.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {movie.comingSoon && (
                    <Badge variant="outline">Coming Soon</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredMovies.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No movies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first movie'}
            </p>
            {!searchTerm && (
              <Button onClick={handleAddMovie}>
                <Plus className="h-4 w-4 mr-2" />
                Add Movie
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <MovieDialog
        movie={selectedMovie}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleMovieUpdate}
      />
    </div>
  );
};