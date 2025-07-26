import { useEffect, useState } from 'react';
import { getMovies } from '@/utils/firebase';
import { Movie, Episode } from '@/types';
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
import { Search, Edit, Trash2, Play, Loader2, Plus, Film } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EpisodeWithSeries extends Episode {
  movieId: string;
  movieName: string;
  movieThumbnail: string;
}

export const EpisodesPage = () => {
  const [episodes, setEpisodes] = useState<EpisodeWithSeries[]>([]);
  const [series, setSeries] = useState<Movie[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<EpisodeWithSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = episodes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(episode =>
        episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        episode.movieName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        episode.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by selected series
    if (selectedSeries !== 'all') {
      filtered = filtered.filter(episode => episode.movieId === selectedSeries);
    }

    setFilteredEpisodes(filtered);
  }, [episodes, searchTerm, selectedSeries]);

  const fetchData = async () => {
    try {
      const movies = await getMovies();
      const seriesMovies = movies.filter(movie => movie.isSeries);
      setSeries(seriesMovies);

      const allEpisodes: EpisodeWithSeries[] = [];
      seriesMovies.forEach(movie => {
        if (movie.parts && movie.parts.length > 0) {
          movie.parts.forEach(episode => {
            allEpisodes.push({
              ...episode,
              movieId: movie.id,
              movieName: movie.name,
              movieThumbnail: movie.thumbnailUrl,
            });
          });
        }
      });

      // Sort by series name and episode number
      allEpisodes.sort((a, b) => {
        if (a.movieName !== b.movieName) {
          return a.movieName.localeCompare(b.movieName);
        }
        return a.episodeNumber - b.episodeNumber;
      });

      setEpisodes(allEpisodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Episodes</h1>
          <p className="text-muted-foreground">
            Manage episodes for series content
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Episode
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
                placeholder="Search episodes by title, series, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Series</SelectItem>
                {series.map((serie) => (
                  <SelectItem key={serie.id} value={serie.id}>
                    {serie.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Episodes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Episode</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Episode #</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEpisodes.map((episode) => (
                <TableRow key={`${episode.movieId}-${episode.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={episode.thumbnailUrl || '/placeholder.svg'}
                        alt={episode.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{episode.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {episode.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={episode.movieThumbnail || '/placeholder.svg'}
                        alt={episode.movieName}
                        className="w-8 h-10 object-cover rounded"
                      />
                      <span className="font-medium">{episode.movieName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Episode {episode.episodeNumber}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4 text-muted-foreground" />
                      {episode.duration}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-success text-success-foreground">
                      Available
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredEpisodes.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No episodes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedSeries !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'No episodes have been added to any series yet'}
            </p>
            {series.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to create a series (movie with "Is Series" enabled) before adding episodes.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};