import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface User {
  username: string;
  role: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => LoginResult;
  logout: () => void;
  isAuthenticated: boolean;
}

// Credenciales de prueba (mock)
const MOCK_CREDENTIALS = { username: 'admin', password: 'admin123' };

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('ct_user');
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((username: string, password: string): LoginResult => {
    if (
      username === MOCK_CREDENTIALS.username &&
      password === MOCK_CREDENTIALS.password
    ) {
      const userData: User = { username, role: 'user' };
      setUser(userData);
      localStorage.setItem('ct_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ct_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
