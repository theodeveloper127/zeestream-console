import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom"; // Import Link for better navigation
import { Frown } from "lucide-react"; // Import a relevant icon
import { Button } from "@/components/ui/button"; // Assuming Button component is available
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming Card components are available

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the 404 error for debugging purposes
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <Card className="w-full max-w-md mx-auto p-6 sm:p-8 text-center shadow-lg rounded-xl border border-border">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <Frown className="h-20 w-20 text-primary-foreground opacity-70" />
          </div>
          <CardTitle className="text-6xl font-extrabold text-primary tracking-tight">
            404
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xl sm:text-2xl font-semibold text-foreground">
            Oops! Page Not Found
          </p>
          <p className="text-md text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Please check the URL or return to the homepage.
          </p>
          <Link to="/">
            <Button className="mt-4 px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out">
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
