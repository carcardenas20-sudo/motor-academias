import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { login, getMe, type TokenData } from '../services/auth';
import { getAcademiaPublicInfo, type AcademiaPublicInfo } from '../services/academias';

interface LoginProps {
  onLoginSuccess: (token: string, userData: TokenData) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brand, setBrand] = useState<AcademiaPublicInfo | null>(null);
  const [loadingBrand, setLoadingBrand] = useState(false);

  useEffect(() => {
    if (tenantSlug) {
      setLoadingBrand(true);
      getAcademiaPublicInfo(tenantSlug)
        .then((info) => {
          setBrand(info);
          // Aplicar color acento dinámicamente
          document.documentElement.style.setProperty('--color-verde', info.color_acento);
        })
        .catch((err) => {
          console.error(err);
          setError('La academia especificada no existe o no está activa.');
        })
        .finally(() => {
          setLoadingBrand(false);
        });
    } else {
      // Restaurar color original del motor
      document.documentElement.style.setProperty('--color-verde', '#3DD68C');
      setBrand(null);
    }
  }, [tenantSlug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener token con contexto del tenant
      const res = await login(email, password, tenantSlug || null);
      
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

  if (loadingBrand) {
    return (
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-[#3DD68C]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold text-[#73827C]">Cargando portal...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 md:p-10 rounded-3xl glassmorphism transition-all duration-500 relative overflow-hidden border border-linea hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
      
      {/* Glow decorativo de fondo */}
      <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300"
        style={{ backgroundColor: 'var(--color-verde)' }} />
      <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full blur-3xl opacity-15 pointer-events-none transition-opacity duration-300"
        style={{ backgroundColor: 'var(--color-azul)' }} />
 
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all hover:scale-105 duration-300 bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.1)]">
            {brand?.logo_url ? (
              <img src={brand.logo_url} alt={brand.nombre} className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <svg className="w-8 h-8" style={{ color: 'var(--color-verde)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-black text-gradient tracking-tight">
            {brand ? brand.nombre : 'Motor Academias'}
          </h2>
          <p className="text-xs mt-2 text-atenuado tracking-wide">
            {brand ? 'Inicia sesión para ingresar a la academia' : 'Inicia sesión para gestionar tus academias'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-xs border flex items-start gap-3 bg-red-500/5 border-red-500/25 text-[#FF5A5A] animate-float-slow">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-atenuado">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-linea outline-none transition-all duration-250 text-sm bg-fondo/60 text-texto input-glow font-medium placeholder:text-atenuado/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-atenuado">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-linea outline-none transition-all duration-250 text-sm bg-fondo/60 text-texto input-glow font-medium placeholder:text-atenuado/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.98] btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
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
