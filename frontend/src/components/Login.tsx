import { useState, type FormEvent } from 'react';
import { login, getMe, type TokenData } from '../services/auth';

interface LoginProps {
  onLoginSuccess: (token: string, userData: TokenData) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener token
      const res = await login(email, password);
      
      // 2. Validar token y obtener info del usuario
      const userData = await getMe(res.access_token);
      
      // 3. Callback de éxito
      onLoginSuccess(res.access_token, userData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al intentar iniciar sesión. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border bg-opacity-70 backdrop-blur-md transition-all duration-300 shadow-2xl relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--color-superficie)', 
        borderColor: 'var(--color-linea)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)' 
      }}>
      
      {/* Glow decorativo de fondo */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--color-verde)' }} />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: 'var(--color-azul)' }} />

      <div className="relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-transform hover:scale-105 duration-300"
            style={{ 
              backgroundColor: 'rgba(61, 214, 140, 0.1)', 
              border: '1px solid rgba(61, 214, 140, 0.2)' 
            }}>
            {/* SVG Logo Icon */}
            <svg className="w-8 h-8" style={{ color: 'var(--color-verde)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-texto)' }}>
            Motor Academias
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-atenuado)' }}>
            Inicia sesión para gestionar tus academias
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm border flex items-start gap-3"
            style={{ 
              backgroundColor: 'rgba(255, 107, 107, 0.08)', 
              borderColor: 'rgba(255, 107, 107, 0.2)',
              color: 'var(--color-rojo)'
            }}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-atenuado)' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
              style={{
                backgroundColor: 'rgba(11, 15, 14, 0.6)',
                borderColor: 'var(--color-linea)',
                color: 'var(--color-texto)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-atenuado)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
              style={{
                backgroundColor: 'rgba(11, 15, 14, 0.6)',
                borderColor: 'var(--color-linea)',
                color: 'var(--color-texto)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.98] shadow-lg hover:shadow-xl cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-verde)',
              color: 'var(--color-fondo)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current animate-duration-750" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Ingresar al Panel</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
