import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

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

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error("Token expired");
        }
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};