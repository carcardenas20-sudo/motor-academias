import type { TokenData } from '../services/auth';

interface DashboardProps {
  user: TokenData;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="w-full max-w-4xl p-6 md:p-8 rounded-2xl border transition-all duration-300 shadow-2xl relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--color-superficie)', 
        borderColor: 'var(--color-linea)',
      }}>
      
      {/* Glow de fondo */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: 'var(--color-verde)' }} />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Header del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-linea)' }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-verde)' }}>
              Panel de Control
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--color-texto)' }}>
              Motor Academias
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-texto)' }}>
                {user.usuario_id ? 'Administrador Activo' : 'Cargando...'}
              </p>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 border"
                style={{ 
                  backgroundColor: 'rgba(61, 214, 140, 0.08)', 
                  borderColor: 'rgba(61, 214, 140, 0.2)',
                  color: 'var(--color-verde)'
                }}>
                {user.rol}
              </span>
            </div>
            
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl border transition-all duration-200 cursor-pointer"
              style={{
                borderColor: 'var(--color-linea)',
                backgroundColor: 'rgba(11, 15, 14, 0.4)',
              }}
              title="Cerrar Sesión"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-rojo)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-linea)';
                e.currentTarget.style.backgroundColor = 'rgba(11, 15, 14, 0.4)';
              }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--color-rojo)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border flex flex-col gap-2"
            style={{ 
              backgroundColor: 'rgba(11, 15, 14, 0.4)', 
              borderColor: 'var(--color-linea)' 
            }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-atenuado)' }}>ID de Usuario</h3>
            <p className="font-mono text-sm break-all" style={{ color: 'var(--color-texto)' }}>{user.usuario_id}</p>
          </div>

          <div className="p-6 rounded-xl border flex flex-col gap-2"
            style={{ 
              backgroundColor: 'rgba(11, 15, 14, 0.4)', 
              borderColor: 'var(--color-linea)' 
            }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-atenuado)' }}>ID de Academia (Tenant)</h3>
            <p className="font-mono text-sm" style={{ color: user.academia_id ? 'var(--color-texto)' : 'var(--color-atenuado)' }}>
              {user.academia_id || 'NULL (Global / Super Admin)'}
            </p>
          </div>

          <div className="p-6 rounded-xl border flex flex-col gap-2"
            style={{ 
              backgroundColor: 'rgba(11, 15, 14, 0.4)', 
              borderColor: 'var(--color-linea)' 
            }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-atenuado)' }}>Permisos</h3>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-verde)' }}>
              Acceso completo de administrador
            </p>
          </div>
        </div>

        {/* Mensaje de bienvenida / guía rápida */}
        <div className="p-6 rounded-xl border flex gap-4 items-start"
          style={{ 
            backgroundColor: 'rgba(91, 200, 255, 0.03)', 
            borderColor: 'rgba(91, 200, 255, 0.1)' 
          }}>
          <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(91, 200, 255, 0.08)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--color-azul)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold" style={{ color: 'var(--color-azul)' }}>
              Estado del Servidor
            </h4>
            <p className="text-sm" style={{ color: 'var(--color-texto)' }}>
              La autenticación mediante JWT ha sido validada de extremo a extremo. Los siguientes pasos consisten en crear el panel de administración global para registrar academias y la base del tenant inicial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
