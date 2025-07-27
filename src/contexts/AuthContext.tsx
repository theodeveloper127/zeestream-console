import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider, // Import GoogleAuthProvider
  signInWithPopup,    // Import signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import setDoc and serverTimestamp
import { auth, db } from '@/firebase/config';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/types'; // Assuming UserProfile is imported from here

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // Add signInWithGoogle
  isAdmin: boolean;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile;
            setUserProfile(profileData);
            setIsAdmin(profileData.role === 'admin');
          } else {
            // If user logs in for the first time with Google and no profile exists
            // Create a basic profile for them
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || undefined,
              photoURL: currentUser.photoURL || undefined,
              createdAt: new Date(), // Use current date for client-side representation
              likedMovies: [],
              role: 'user', // Default role for new Google sign-ins
            };
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: serverTimestamp(), // Use serverTimestamp for Firestore
            }, { merge: true }); // Use merge to avoid overwriting other fields if they exist
            setUserProfile(newProfile);
            setIsAdmin(false); // New users from Google are 'user' role by default
            toast({
              title: "Profile Created",
              description: "A new user profile has been created for your account.",
            });
          }
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
          setUserProfile(null);
          setIsAdmin(false);
          toast({
            title: "Error",
            description: "Could not fetch or create user profile.",
            variant: "destructive",
          });
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login successful",
        description: "Welcome to Zeestream Admin",
      });
    } catch (error: any) { // Use 'any' or more specific type if you know it
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true); // Indicate loading for Google sign-in
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Google Sign-in Successful",
        description: "Welcome to Zeestream Admin!",
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Google Sign-in Failed",
        description: error.message || "An error occurred during Google sign-in.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false); // End loading regardless of success or failure
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signInWithGoogle, // Include signInWithGoogle in the context value
    isAdmin,
    userProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};