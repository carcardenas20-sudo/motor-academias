import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getMe, type TokenData } from './services/auth';
import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<TokenData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const userData = await getMe(savedToken);
          setUser(userData);
        } catch (err) {
          console.warn('Sesión guardada inválida o expirada:', err);
          localStorage.removeItem('token');
        }
      }
      setCheckingAuth(false);
    }
    checkSession();
  }, []);

  const handleLoginSuccess = (newToken: string, userData: TokenData) => {
    localStorage.setItem('token', newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-fondo)' }}>
      <Toaster richColors theme="dark" position="top-right" />
      {checkingAuth ? (
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 animate-duration-750" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-verde)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold tracking-wide" style={{ color: 'var(--color-atenuado)' }}>
            Verificando sesión...
          </p>
        </div>
      ) : user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

