import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { getMe, type TokenData } from './services/auth';
import { Toaster } from 'sonner';

function AppContent() {
  const [user, setUser] = useState<TokenData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

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
    
    if (userData.rol === 'super_admin') {
      navigate('/');
    } else {
      // Si el token tiene academia_id, redirigiremos al tenant correspondiente
      // (el dashboard resolverá la vista o podemos redirigir al slug actual si ya existe)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 w-full"
        style={{ backgroundColor: 'var(--color-fondo)' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 animate-duration-750" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-verde)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold tracking-wide" style={{ color: 'var(--color-atenuado)' }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full"
      style={{ backgroundColor: 'var(--color-fondo)' }}>
      <Routes>
        {/* Ruta principal (Solo para Super Admin, redirección para otros) */}
        <Route path="/" element={
          user ? (
            user.rol === 'super_admin' ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <div className="min-h-screen w-full flex items-center justify-center p-4">
                <div className="text-center p-8 border rounded-2xl glassmorphism max-w-md"
                  style={{ borderColor: 'var(--color-linea)', backgroundColor: 'var(--color-superficie)' }}>
                  <h3 className="text-lg font-bold mb-2 text-[#E7EDEA]">Acceso correcto</h3>
                  <p className="text-xs text-[#73827C] mb-6">
                    Has iniciado sesión. Por favor, ingresa al portal específico de tu academia para ver tus contenidos.
                  </p>
                  <button onClick={handleLogout} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Login global para Super Admin */}
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
        } />

        {/* Login contextualizado por Academia */}
        <Route path="/:tenantSlug/login" element={
          <TenantLoginWrapper user={user} onLoginSuccess={handleLoginSuccess} />
        } />

        {/* Vista del Tenant / Academia */}
        <Route path="/:tenantSlug" element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <LandingPage />
          )
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function TenantLoginWrapper({ user, onLoginSuccess }: { user: TokenData | null; onLoginSuccess: (token: string, userData: TokenData) => void }) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  if (user) {
    return <Navigate to={`/${tenantSlug}`} replace />;
  }
  return <Login onLoginSuccess={onLoginSuccess} />;
}


export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors theme="dark" position="top-right" />
      <AppContent />
    </BrowserRouter>
  );
}

