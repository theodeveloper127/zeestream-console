import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/utils/firebase';
import { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Film, Play, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Stats Cards */}
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

      {/* Recent Movies */}
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