import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type LoginData, type RegisterData } from '../services/authService';
import { userService, type UserProfile } from '../../user/services/userService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateUserContextData: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await userService.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    localStorage.setItem('token', response.accessToken);
    setToken(response.accessToken);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await authService.loginWithGoogle(idToken);
    localStorage.setItem('token', response.accessToken);
    setToken(response.accessToken);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    if (response.accessToken) {
      localStorage.setItem('token', response.accessToken);
      setToken(response.accessToken);
    }
  };

  const updateUserContextData = (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, loginWithGoogle, register, updateUserContextData, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
