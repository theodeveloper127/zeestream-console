import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/utils/firebase';
import { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Film, Play, Users, MessageSquare, Calendar, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AnalyticsPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
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

  const totalContent = (stats?.totalMovies || 0) + (stats?.totalEpisodes || 0);
  const averageEpisodesPerSeries = stats?.totalSeries ? 
    Math.round((stats?.totalEpisodes || 0) / stats.totalSeries) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Platform insights and performance metrics
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Content
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalContent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Movies + Episodes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Content Ratio
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <Film className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalMovies ? 
                Math.round(((stats.totalSeries || 0) / stats.totalMovies) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Series vs Movies
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Episodes/Series
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50">
              <Play className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {averageEpisodesPerSeries}
            </div>
            <p className="text-xs text-muted-foreground">
              Episodes per series
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comments/Movie
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-50">
              <MessageSquare className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalMovies ? 
                Math.round((stats?.totalComments || 0) / stats.totalMovies) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Content Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Film className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Movies</p>
                    <p className="text-sm text-muted-foreground">Total content</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats?.totalMovies || 0}</p>
                  <p className="text-sm text-muted-foreground">items</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Play className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Series</p>
                    <p className="text-sm text-muted-foreground">Multi-episode content</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats?.totalSeries || 0}</p>
                  <p className="text-sm text-muted-foreground">series</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium">Episodes</p>
                    <p className="text-sm text-muted-foreground">Series episodes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats?.totalEpisodes || 0}</p>
                  <p className="text-sm text-muted-foreground">episodes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Total Users</p>
                    <p className="text-sm text-muted-foreground">Registered accounts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">users</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Comments</p>
                    <p className="text-sm text-muted-foreground">User feedback</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
                  <p className="text-sm text-muted-foreground">comments</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="font-medium">Engagement Rate</p>
                    <p className="text-sm text-muted-foreground">Comments per user</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {stats?.totalUsers ? 
                      ((stats?.totalComments || 0) / stats.totalUsers).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-sm text-muted-foreground">avg/user</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentMovies && stats.recentMovies.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground mb-3">Recently Added Movies</h3>
              {stats.recentMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={movie.thumbnailUrl || '/placeholder.svg'}
                      alt={movie.name}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-medium">{movie.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {movie.category} • {movie.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {movie.uploadDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{movie.rating}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};