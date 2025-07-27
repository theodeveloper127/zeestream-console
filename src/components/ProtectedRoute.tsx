import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button component

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isAdmin, logout } = useAuth(); // Destructure logout from useAuth

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-lg text-muted-foreground mb-6">
            You do not have the necessary admin privileges to view this page.
          </p>

          <div className="space-y-4">
            <Button onClick={logout} className="w-full sm:w-auto px-6 py-2">
              Logout
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              If you believe this is an error or require assistance, please contact the technical administrator or developer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};