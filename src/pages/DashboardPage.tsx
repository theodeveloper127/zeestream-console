import { useEffect, useState } from 'react';
import axios from 'axios'; // Import axios
import { getDashboardStats } from '@/utils/firebase';
import { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Film, Play, Users, MessageSquare, TrendingUp, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CommandStatus = {
  status: 'idle' | 'scrapping' | 'done' | 'error'; // 'analyzing' state removed as per request
  message?: string;
};
const API_BASE_URL = import.meta.env.VITE_API_SCRAP_URL;

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  // commandLoading now stores a map of button IDs to their current status
  const [commandLoading, setCommandLoading] = useState<Record<string, CommandStatus>>({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const sendScrapCommand = async (source: string) => {
    // Set initial status to 'scrapping' for the specific button
    setCommandLoading(prev => ({ ...prev, [source]: { status: 'scrapping' } }));

    try {

      const apiUrl = `${API_BASE_URL}/scrapping/web/${source}`;

      // Use axios to make the GET request to the dynamic URL
      const response = await axios.get(apiUrl);

      // Set status to 'done' immediately after successful API call
      const message = response.data.message || 'Scrapping and analysis data initiated.';
      setCommandLoading(prev => ({ ...prev, [source]: { status: 'done', message: message } }));
      toast({
        title: "Success",
        description: `${message} Done!`, // Updated success message
      });

    } catch (error) {
      console.error(`Error sending scrap command for ${source}:`, error);
      let errorMessage = `Failed to scrap from ${source}. Please try again.`;
      // Check if it's an Axios error with a response to get more specific message
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Failed to scrap from ${source}: ${error.response.data.message || error.message}. Please try again.`;
      }
      // Set status to 'error' immediately after API call failure
      setCommandLoading(prev => ({ ...prev, [source]: { status: 'error', message: errorMessage } }));
      toast({
        title: "Error",
        description: errorMessage,
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

  // Configuration for dashboard statistics cards
  const statCards = [
    {
      title: 'Total Movies',
      value: stats?.totalMovies || 0,
      icon: Film,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Series',
      value: stats?.totalSeries || 0,
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Episodes',
      value: stats?.totalEpisodes || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Comments',
      value: stats?.totalComments || 0,
      icon: MessageSquare,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  // Configuration for dynamic scrap command buttons
  const scrapButtons = [
    {
      id: 'mihetoFilms',
      title: 'Scrap MihetofIlms',
      icon: Film,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 'oshakurFilms',
      title: 'Scrap OshakurFilms',
      icon: Film,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'anotherSource1',
      title: 'Scrap Another Source 1',
      icon: Film,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      id: 'anotherSource2',
      title: 'Scrap Another Source 2',
      icon: Film,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      id: 'anotherSource3',
      title: 'Scrap Another Source 3',
      icon: Film,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Zeestream Admin Panel
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scrap Commands Section */}
      <h2 className="text-2xl font-bold text-foreground mt-8">Scrap Commands</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {scrapButtons.map((button) => {
          // Get the current status for this specific button
          const currentCommandStatus = commandLoading[button.id];
          // Button is disabled only when it's actively 'scrapping'
          const isDisabled = currentCommandStatus?.status === 'scrapping';

          return (
            <Card
              key={button.id}
              className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
              // Card's onClick is removed to ensure only the Button handles the action
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {button.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${button.bgColor}`}>
                  <button.icon className={`h-4 w-4 ${button.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  variant="outline"
                  className="w-full justify-between items-center"
                  onClick={() => sendScrapCommand(button.id)} // Button handles the click
                  disabled={isDisabled} // Disable button based on its specific status
                >
                  {currentCommandStatus?.status === 'scrapping' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scrapping...
                    </>
                  ) : currentCommandStatus?.status === 'done' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Done!
                    </>
                  ) : currentCommandStatus?.status === 'error' ? (
                    <>
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Error!
                    </>
                  ) : (
                    <>
                      Scrap the web
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Movies Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Recent Movies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentMovies && stats.recentMovies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <img
                    src={movie.thumbnailUrl || '/placeholder.svg'}
                    alt={movie.name}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {movie.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {movie.category} • {movie.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movie.uploadDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ⭐ {movie.rating}/10
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Film className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No movies uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
