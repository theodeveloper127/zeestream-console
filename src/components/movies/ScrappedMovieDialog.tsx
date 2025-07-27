import { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios for backend API calls
import { Movie } from '@/types'; // Importing Movie interface

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScrappedMovieDialogProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Define the backend API base URL for scrapped movies
const API_SCRAPPED_MOVIES_BASE_URL = import.meta.env.VITE_API_SCRAPPED_MOVIES_URL;

// Helper function for slug generation (can be shared or duplicated)
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const categories = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Animation',
  'Documentary',
  'Fantasy',
  'Mystery',
];

export const ScrappedMovieDialog: React.FC<ScrappedMovieDialogProps> = ({
  movie,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  // Initialize form data based on 'movie' prop or default values
  const [formData, setFormData] = useState({
    name: movie?.name || '',
    thumbnailUrl: movie?.thumbnailUrl || '',
    type: movie?.type || 'original',
    category: movie?.category || '',
    rating: movie?.rating?.toString() || '0',
    description: movie?.description || '',
    trailerUrl: movie?.trailerUrl || '',
    isSeries: movie?.isSeries || false,
    relationship: movie?.relationship || '',
    comingSoon: movie?.comingSoon || false,
    releaseDate: movie?.releaseDate ? movie.releaseDate.toISOString().split('T')[0] : '',
    translator: movie?.translator || '',
    watchUrl: movie?.watchUrl || '',
    downloadUrl: movie?.downloadUrl || '',
  });

  // Reset form data when dialog opens or 'movie' prop changes
  useEffect(() => {
    setFormData({
      name: movie?.name || '',
      thumbnailUrl: movie?.thumbnailUrl || '',
      type: movie?.type || 'original',
      category: movie?.category || '',
      rating: movie?.rating?.toString() || '0',
      description: movie?.description || '',
      trailerUrl: movie?.trailerUrl || '',
      isSeries: movie?.isSeries || false,
      relationship: movie?.relationship || '',
      comingSoon: movie?.comingSoon || false,
      releaseDate: movie?.releaseDate ? movie.releaseDate.toISOString().split('T')[0] : '',
      translator: movie?.translator || '',
      watchUrl: movie?.watchUrl || '',
      downloadUrl: movie?.downloadUrl || '',
    });
  }, [movie, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!API_SCRAPPED_MOVIES_BASE_URL) {
        throw new Error("VITE_API_SCRAPPED_MOVIES_URL is not defined in environment variables.");
      }

      // Prepare movie data for backend (MongoDB update)
      const movieData = {
        name: formData.name,
        slug: generateSlug(formData.name),
        thumbnailUrl: formData.thumbnailUrl,
        type: formData.type as 'original' | 'translated',
        category: formData.category,
        rating: parseFloat(formData.rating),
        description: formData.description,
        trailerUrl: formData.trailerUrl,
        isSeries: formData.isSeries,
        relationship: formData.relationship,
        comingSoon: formData.comingSoon,
        // Convert date string back to ISO string or Date object if backend expects it
        releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : null,
        translator: formData.type === 'translated' ? formData.translator : '',
        watchUrl: formData.watchUrl,
        downloadUrl: formData.downloadUrl || '',
        // Likes and comments might be managed by the backend, send current values
        likes: movie?.likes || 0,
        comments: movie?.comments || [],
        // Assuming backend handles uploadDate, if not, you might send it too
      };

      if (movie) {
        // Update existing scrapped movie via backend API (PUT request)
        await axios.put(`${API_SCRAPPED_MOVIES_BASE_URL}/movies/${movie.id}`, movieData);
        toast({
          title: "Success",
          description: "Scrapped movie updated successfully in backend",
        });
      } else {
        // This dialog is primarily for updating existing scrapped movies.
        // If you need to add new scrapped movies via the backend, you'd implement axios.post here.
        // For now, it's assumed new scrapped movies come from the scraping process.
        toast({
          title: "Info",
          description: "This dialog is for editing existing scrapped movies. To add new ones, use the scraping process.",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      onSuccess(); // Trigger refresh of scrapped movies list in parent
    } catch (error) {
      console.error('Error saving scrapped movie:', error);
      let errorMessage = "Failed to save scrapped movie to backend.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Failed to save scrapped movie: ${error.response.status} - ${error.response.data.message || error.message}`;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {movie ? 'Edit Scrapped Movie' : 'Add New Scrapped Movie (via backend)'}
          </DialogTitle>
          <DialogDescription>
            {movie ? 'Update scrapped movie information in the backend' : 'This dialog is for editing existing scrapped movies.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Movie Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter movie name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="translated">Translated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-10) *</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
          </div>

          {formData.type === 'translated' && (
            <div className="space-y-2">
              <Label htmlFor="translator">Translator</Label>
              <Input
                id="translator"
                value={formData.translator}
                onChange={(e) => handleInputChange('translator', e.target.value)}
                placeholder="Translator name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Movie description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailerUrl">Trailer URL</Label>
            <Input
              id="trailerUrl"
              value={formData.trailerUrl}
              onChange={(e) => handleInputChange('trailerUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL *</Label>
            <Input
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
            {formData.thumbnailUrl && (
              <img
                src={formData.thumbnailUrl}
                alt="Thumbnail preview"
                className="w-24 h-32 object-cover rounded border mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship Key *</Label>
            <Input
              id="relationship"
              value={formData.relationship}
              onChange={(e) => handleInputChange('relationship', e.target.value)}
              placeholder="e.g., john-wick-saga or standalone-movie"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watchUrl">Watch URL *</Label>
            <Input
              id="watchUrl"
              value={formData.watchUrl}
              onChange={(e) => handleInputChange('watchUrl', e.target.value)}
              placeholder="https://yourstreaming.com/movie/..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="downloadUrl">Download URL (Optional)</Label>
            <Input
              id="downloadUrl"
              value={formData.downloadUrl}
              onChange={(e) => handleInputChange('downloadUrl', e.target.value)}
              placeholder="https://yourdownload.com/movie/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseDate">Release Date</Label>
            <Input
              id="releaseDate"
              type="date"
              value={formData.releaseDate}
              onChange={(e) => handleInputChange('releaseDate', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isSeries"
                checked={formData.isSeries}
                onCheckedChange={(checked) => handleInputChange('isSeries', checked)}
              />
              <Label htmlFor="isSeries">Is Series</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="comingSoon"
                checked={formData.comingSoon}
                onCheckedChange={(checked) => handleInputChange('comingSoon', checked)}
              />
              <Label htmlFor="comingSoon">Coming Soon</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Scrapped Movie'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
