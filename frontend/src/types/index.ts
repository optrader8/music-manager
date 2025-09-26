export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface HeaderProps {
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export interface SidebarProps {
  navigationItems: NavigationItem[];
  onNavigate?: (itemId: string) => void;
}

export interface ContentProps {
  onLogin?: (data: LoginFormData) => void;
  onSignUp?: () => void;
  isLoading?: boolean;
}
