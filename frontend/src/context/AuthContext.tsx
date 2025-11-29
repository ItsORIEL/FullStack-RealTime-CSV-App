import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";

// 1. Define what the Token looks like inside
interface TokenPayload {
  sub: string;  // username
  role: string; // admin or user
  exp: number;
}

// 2. Define what our Auth Context provides to the app
interface AuthContextType {
  token: string | null;
  role: string | null;
  username: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // When the app starts, or token changes, decode it
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setRole(decoded.role);
        setUsername(decoded.sub);
        localStorage.setItem("token", token);
      } catch (error) {
        console.error("Invalid token", error);
        logout();
      }
    } else {
      localStorage.removeItem("token");
      setRole(null);
      setUsername(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};