import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MoviesPage } from "./pages/MoviesPage";
import { EpisodesPage } from "./pages/EpisodesPage";
import { UsersPage } from "./pages/UsersPage";
import { CommentsPage } from "./pages/CommentsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="movies" element={<MoviesPage />} />
              <Route path="episodes" element={<EpisodesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Redirect root to admin */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
