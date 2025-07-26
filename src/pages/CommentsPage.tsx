import { useEffect, useState } from 'react';
import { getMovies, deleteComment } from '@/utils/firebase';
import { Movie, Comment } from '@/types';
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
import { Search, Trash2, MessageSquare, Loader2, Film } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CommentWithMovie extends Comment {
  movieId: string;
  movieName: string;
  movieThumbnail: string;
}

export const CommentsPage = () => {
  const [comments, setComments] = useState<CommentWithMovie[]>([]);
  const [filteredComments, setFilteredComments] = useState<CommentWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    const filtered = comments.filter(comment =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.movieName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredComments(filtered);
  }, [comments, searchTerm]);

  const fetchComments = async () => {
    try {
      const movies = await getMovies();
      const allComments: CommentWithMovie[] = [];

      movies.forEach(movie => {
        if (movie.comments && movie.comments.length > 0) {
          movie.comments.forEach(comment => {
            allComments.push({
              ...comment,
              movieId: movie.id,
              movieName: movie.name,
              movieThumbnail: movie.thumbnailUrl,
            });
          });
        }
      });

      // Sort by timestamp (newest first)
      allComments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setComments(allComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (movieId: string, commentId: string) => {
    try {
      await deleteComment(movieId, commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comments</h1>
          <p className="text-muted-foreground">
            Moderate user comments and feedback
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by comment content, user email, or movie name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Movie</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.map((comment) => (
                <TableRow key={`${comment.movieId}-${comment.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.movieThumbnail || '/placeholder.svg'}
                        alt={comment.movieName}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{comment.movieName}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {comment.movieId.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{comment.userEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        {comment.userId.substring(0, 8)}...
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm line-clamp-3">{comment.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{comment.timestamp.toLocaleDateString()}</p>
                      <p className="text-muted-foreground">
                        {comment.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">Comment preview:</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                "{comment.content.substring(0, 100)}..."
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteComment(comment.movieId, comment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredComments.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No comments found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria' : 'No comments have been posted yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};