import React, { createContext, useContext, useState, useEffect } from "react";

export type RoleType = "ADMIN" | "EVALUATOR";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  username?: string;
  staffCode?: string;
  phoneNumber?: string;
  honorific?: string;
  gender?: string;
  dateOfBirth?: string;
  languages?: string[];
  confessionFather?: string;
  country?: string;
  city?: string;
  subcity?: string;
  woreda?: string;
  houseNumber?: string;
  homeParish?: string;
  specialization?: string;
  panel?: string;
  governanceScope?: string;
  role: RoleType;
  campusId: string | null;
  campusName: string | null;
  permissions: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isEvaluator: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("c_cimas_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error("Session verification error:", err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Authentication failed");
    }

    setToken(data.data.token);
    setUser(data.data.user);
    localStorage.setItem("c_cimas_token", data.data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("c_cimas_token");
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!token) throw new Error("No active authentication session");
    const res = await fetch("/api/v1/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    const updated = data.data.user;
    setUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
    if (!token) throw new Error("No active authentication session");
    const res = await fetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to change password");
    }
    return data.message || "Password changed successfully";
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return user.permissions.includes(permission);
  };

  const isAdmin = user?.role === "ADMIN";
  const isEvaluator = user?.role === "EVALUATOR";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isEvaluator,
        login,
        logout,
        updateUserProfile,
        changePassword,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
