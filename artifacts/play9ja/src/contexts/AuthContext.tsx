import { createContext, useContext, useEffect, useState } from "react";
import { useGetCurrentUser, useLogoutUser } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/src/custom-fetch";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("play9ja_token"));
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("play9ja_token"));
  }, []);

  const { data: user, isLoading: isUserLoading, error } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const logoutMutation = useLogoutUser();

  const login = (newToken: string, user: User) => {
    localStorage.setItem("play9ja_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    if (token) {
      logoutMutation.mutate(undefined, {
        onSettled: () => {
          localStorage.removeItem("play9ja_token");
          setToken(null);
          setLocation("/login");
        }
      });
    } else {
      localStorage.removeItem("play9ja_token");
      setToken(null);
      setLocation("/login");
    }
  };

  useEffect(() => {
    if (error) {
      logout();
      toast({
        title: "Session Expired",
        description: "Please login again.",
        variant: "destructive"
      });
    }
  }, [error]);

  const isLoading = isUserLoading && !!token;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
