import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Local loading for email/password form
  const { user, login, signInWithGoogle, loading: authLoading } = useAuth(); // Destructure signInWithGoogle and authLoading from context

  // authLoading from context covers all auth operations (email/password, Google)
  const isOverallLoading = loading || authLoading;

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set local loading for this specific form submission
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // signInWithGoogle handles its own loading state internally via authLoading from context
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in process failed:', error);
      // The toast message is already handled in AuthProvider
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-gradient p-4">
      <Card className="w-full max-w-md shadow-admin">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Film className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Zeestream Admin</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@zeestream.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isOverallLoading} // Disable input if any auth operation is ongoing
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isOverallLoading} // Disable input if any auth operation is ongoing
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isOverallLoading}
            >
              {isOverallLoading && loading ? ( // Show specific loading only for email/password form
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In with Email'
              )}
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleGoogleSignIn}
            disabled={isOverallLoading}
          >
            {isOverallLoading && !loading ? ( // Show loading specific to Google if email/password isn't loading
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <FcGoogle className="mr-2 h-5 w-5" />
                Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};