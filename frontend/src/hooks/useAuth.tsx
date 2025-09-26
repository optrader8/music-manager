import React from "react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // 개발환경에서는 자동으로 테스트 사용자 로그인
    const devUser: User = {
      id: "dev-user",
      email: "dev@test.com",
      name: "Dev User",
    };
    setUser(devUser);
    setIsLoading(false);
  }, []);

  const login = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Login attempt:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData: User = {
        id: "1",
        email: data.email,
        name: "User",
      };

      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
