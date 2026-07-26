"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import type { AuthResult, AuthUser, UserProfile } from "@/lib/types";

const ACCESS_KEY = "hp.accessToken";
const REFRESH_KEY = "hp.refreshToken";
const USER_KEY = "hp.user";

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: <T>(path: string, options?: Parameters<typeof apiFetch>[1]) => Promise<T>;
  uploadFile: <T>(path: string, file: File) => Promise<T>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = localStorage.getItem(ACCESS_KEY);
    refreshTokenRef.current = localStorage.getItem(REFRESH_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser && refreshTokenRef.current) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((result: AuthResult) => {
    accessTokenRef.current = result.accessToken;
    refreshTokenRef.current = result.refreshToken;
    localStorage.setItem(ACCESS_KEY, result.accessToken);
    localStorage.setItem(REFRESH_KEY, result.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const clear = useCallback(() => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<AuthResult>("/auth/login", { method: "POST", body: { email, password } });
      persist(result);
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await apiFetch<AuthResult>("/auth/register", { method: "POST", body: payload });
      persist(result);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const refreshToken = refreshTokenRef.current;
    clear();
    if (refreshToken) {
      try {
        await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });
      } catch {
        // Best-effort: local session is already cleared regardless of server response.
      }
    }
  }, [clear]);

  const doRefresh = useCallback(async (): Promise<string> => {
    const refreshToken = refreshTokenRef.current;
    if (!refreshToken) {
      throw new ApiError(401, "Not authenticated");
    }
    const tokens = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    accessTokenRef.current = tokens.accessToken;
    refreshTokenRef.current = tokens.refreshToken;
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    return tokens.accessToken;
  }, []);

  const authFetch = useCallback(
    async <T,>(path: string, options: Parameters<typeof apiFetch>[1] = {}): Promise<T> => {
      try {
        return await apiFetch<T>(path, { ...options, token: accessTokenRef.current });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && refreshTokenRef.current) {
          try {
            const newToken = await doRefresh();
            return await apiFetch<T>(path, { ...options, token: newToken });
          } catch {
            clear();
            throw error;
          }
        }
        throw error;
      }
    },
    [doRefresh, clear],
  );

  const uploadFile = useCallback(
    async <T,>(path: string, file: File): Promise<T> => {
      try {
        return await apiUpload<T>(path, file, accessTokenRef.current);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && refreshTokenRef.current) {
          try {
            const newToken = await doRefresh();
            return await apiUpload<T>(path, file, newToken);
          } catch {
            clear();
            throw error;
          }
        }
        throw error;
      }
    },
    [doRefresh, clear],
  );

  const refreshProfile = useCallback(async () => {
    if (!refreshTokenRef.current) return;
    const profile = await authFetch<UserProfile>("/users/me");
    setUser(profile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }, [authFetch]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, authFetch, uploadFile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
