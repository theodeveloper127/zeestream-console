import { useState, useRef } from 'react';
import { Movie } from '@/types';
import { addMovie, updateMovie, uploadFile, generateSlug } from '@/utils/firebase';
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
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MovieDialogProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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

export const MovieDialog: React.FC<MovieDialogProps> = ({
  movie,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: movie?.name || '',
    thumbnailUrl: movie?.thumbnailUrl || '',
    type: movie?.type || 'original',
    category: movie?.category || '',
    rating: movie?.rating?.toString() || '0',
    description: movie?.description || '',
    trailerUrl: movie?.trailerUrl || '',
    isSeries: movie?.isSeries || false,
    comingSoon: movie?.comingSoon || false,
    releaseDate: movie?.releaseDate ? movie.releaseDate.toISOString().split('T')[0] : '',
    translator: movie?.translator || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const path = `thumbnails/${Date.now()}_${file.name}`;
      const downloadURL = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, thumbnailUrl: downloadURL }));
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
        comingSoon: formData.comingSoon,
        releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : undefined,
        translator: formData.type === 'translated' ? formData.translator : undefined,
        likes: movie?.likes || 0,
        comments: movie?.comments || [],
        parts: movie?.parts || [],
      };

      if (movie) {
        await updateMovie(movie.id, movieData);
        toast({
          title: "Success",
          description: "Movie updated successfully",
        });
      } else {
        await addMovie(movieData);
        toast({
          title: "Success",
          description: "Movie added successfully",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving movie:', error);
      toast({
        title: "Error",
        description: "Failed to save movie",
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
            {movie ? 'Edit Movie' : 'Add New Movie'}
          </DialogTitle>
          <DialogDescription>
            {movie ? 'Update movie information' : 'Fill in the details to add a new movie'}
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
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-4">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Thumbnail
              </Button>
              {formData.thumbnailUrl && (
                <img
                  src={formData.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-16 h-20 object-cover rounded border"
                />
              )}
            </div>
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
                  {movie ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                movie ? 'Update Movie' : 'Add Movie'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};