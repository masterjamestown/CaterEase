import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionStorage.getItem('caterease_token')) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then(setUser)
      .catch(() => sessionStorage.removeItem('caterease_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(data) {
    sessionStorage.setItem('caterease_token', data.token);
    setUser(data.user);
  }

  function logout() {
    sessionStorage.removeItem('caterease_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
