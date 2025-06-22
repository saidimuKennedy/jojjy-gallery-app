import { User } from "@prisma/client";
import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: User | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  const login = async (email: string, password: string): Promise<string | null> => {
    setIsLoadingAuth(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return null; // Return null on successful login
      } else {
        setUser(null);
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      return 'Network error or server unavailable'; 
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });   

      if (response.ok) {
        setUser(null);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Logout failed");
      }

    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const contextValue = {
    user,
    isLoadingAuth,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}