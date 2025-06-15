
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ReplitUser {
  id: string;
  name: string;
  profileImage: string;
  bio: string;
  url: string;
  roles: string[];
  teams: string[];
}

interface ReplitAuthContextType {
  user: ReplitUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const ReplitAuthContext = createContext<ReplitAuthContextType | undefined>(undefined);

export const ReplitAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ReplitUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/__replauthuser');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.addEventListener("message", authComplete);
    const h = 500;
    const w = 350;
    const left = screen.width / 2 - w / 2;
    const top = screen.height / 2 - h / 2;

    const authWindow = window.open(
      "https://replit.com/auth_with_repl_site?domain=" + location.host,
      "_blank",
      "modal=yes, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
        w +
        ", height=" +
        h +
        ", top=" +
        top +
        ", left=" +
        left
    );

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      window.removeEventListener("message", authComplete);
      if (authWindow) {
        authWindow.close();
      }
      location.reload();
    }
  };

  const logout = () => {
    // Replit Auth doesn't have a built-in logout, so we'll clear the user state
    // and redirect to clear the session
    setUser(null);
    window.location.href = '/';
  };

  const contextValue: ReplitAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <ReplitAuthContext.Provider value={contextValue}>
      {children}
    </ReplitAuthContext.Provider>
  );
};

export const useReplitAuth = (): ReplitAuthContextType => {
  const context = useContext(ReplitAuthContext);
  if (!context) {
    throw new Error('useReplitAuth must be used within a ReplitAuthProvider');
  }
  return context;
};
