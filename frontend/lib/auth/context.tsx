"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  LoginCredentials,
  RegisterData,
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  logout as apiLogout,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "./api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setIsLoading(false);
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.push("/login");
      }
      return;
    }

    try {
      const userData = await getCurrentUser(token);
      setUser(userData);

      if (PUBLIC_PATHS.includes(pathname)) {
        router.push("/");
      }
    } catch {
      removeStoredToken();
      setUser(null);
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginCredentials) => {
    const response = await apiLogin(credentials);
    setStoredToken(response.access_token);
    const userData = await getCurrentUser(response.access_token);
    setUser(userData);
    router.push("/");
  };

  const register = async (data: RegisterData) => {
    await apiRegister(data);
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    const token = getStoredToken();
    if (token) {
      await apiLogout(token);
    }
    removeStoredToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
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
