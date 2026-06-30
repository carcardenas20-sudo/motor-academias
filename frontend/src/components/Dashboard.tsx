import { useState, useEffect } from 'react';
import type { TokenData } from '../services/auth';
import {
  getAcademias,
  createAcademia,
  getAcademiaAdmins,
  createAcademiaAdmin,
  type Academia,
  type AdminResponse
} from '../services/academias';

interface DashboardProps {
  user: TokenData;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const token = localStorage.getItem('token') || '';

  // Estados de Academias
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [loadingAcademias, setLoadingAcademias] = useState(false);
  const [errorAcademias, setErrorAcademias] = useState<string | null>(null);
  
  // Estado Selección
  const [selectedAcademia, setSelectedAcademia] = useState<Academia | null>(null);
  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [errorAdmins, setErrorAdmins] = useState<string | null>(null);

  // Estados Modales
  const [showCreateAcademiaModal, setShowCreateAcademiaModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // Formulario de Nueva Academia
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [colorAcento, setColorAcento] = useState('#3DD68C');
  const [creatingAcademia, setCreatingAcademia] = useState(false);
  const [formErrorAcademia, setFormErrorAcademia] = useState<string | null>(null);

  // Formulario de Nuevo Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [formErrorAdmin, setFormErrorAdmin] = useState<string | null>(null);

  // Cargar Academias si es super_admin
  useEffect(() => {
    if (user.rol === 'super_admin' && token) {
      loadAcademias();
    }
  }, [user.rol, token]);

  // Cargar Administradores cuando se selecciona una academia
  useEffect(() => {
    if (selectedAcademia && token) {
      loadAdmins(selectedAcademia.id);
    } else {
      setAdmins([]);
    }
  }, [selectedAcademia, token]);

  const loadAcademias = async () => {
    setLoadingAcademias(true);
    setErrorAcademias(null);
    try {
      const data = await getAcademias(token);
      setAcademias(data);
    } catch (err: any) {
      setErrorAcademias(err.message || 'Error al cargar las academias.');
    } finally {
      setLoadingAcademias(false);
    }
  };

  const loadAdmins = async (academiaId: string) => {
    setLoadingAdmins(true);
    setErrorAdmins(null);
    try {
      const data = await getAcademiaAdmins(token, academiaId);
      setAdmins(data);
    } catch (err: any) {
      setErrorAdmins(err.message || 'Error al cargar los administradores.');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateAcademia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !slug) {
      setFormErrorAcademia('El nombre y el slug son campos requeridos.');
      return;
    }

    setCreatingAcademia(true);
    setFormErrorAcademia(null);
    try {
      const nueva = await createAcademia(token, {
        nombre,
        slug: slug.toLowerCase().trim(),
        descripcion: descripcion || undefined,
        logo_url: logoUrl || undefined,
        color_acento: colorAcento
      });
      setAcademias((prev) => [nueva, ...prev]);
      setShowCreateAcademiaModal(false);
      // Reset campos
      setNombre('');
      setSlug('');
      setDescripcion('');
      setLogoUrl('');
      setColorAcento('#3DD68C');
    } catch (err: any) {
      setFormErrorAcademia(err.message || 'Ocurrió un error al crear la academia.');
    } finally {
      setCreatingAcademia(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcademia) return;
    if (!adminEmail || !adminPassword || !adminNombre) {
      setFormErrorAdmin('Todos los campos son obligatorios.');
      return;
    }

    setCreatingAdmin(true);
    setFormErrorAdmin(null);
    try {
      const nuevoAdmin = await createAcademiaAdmin(token, selectedAcademia.id, {
        email: adminEmail,
        password: adminPassword,
        nombre: adminNombre
      });
      setAdmins((prev) => [nuevoAdmin, ...prev]);
      setShowCreateAdminModal(false);
      // Reset campos
      setAdminEmail('');
      setAdminPassword('');
      setAdminNombre('');
    } catch (err: any) {
      setFormErrorAdmin(err.message || 'Ocurrió un error al registrar el administrador.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Helper para generar slug sugerido
  const handleNombreChange = (val: string) => {
    setNombre(val);
    const suggestedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
      .trim()
      .replace(/\s+/g, '-'); // Cambiar espacios por guiones
    setSlug(suggestedSlug);
  };

  return (
    <div className="w-full max-w-6xl p-6 md:p-8 rounded-2xl border transition-all duration-300 shadow-2xl relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--color-superficie)', 
        borderColor: 'var(--color-linea)',
      }}>
      
      {/* Glow de fondo dinámico según selección */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: selectedAcademia ? selectedAcademia.color_acento : 'var(--color-verde)' }} />

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* HEADER DEL DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-linea)' }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-verde)' }}>
              {user.rol === 'super_admin' ? 'Administrador Global' : 'Panel de Control'}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--color-texto)' }}>
              Motor Academias
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-texto)' }}>
                {user.rol === 'super_admin' ? 'Carlos' : 'Usuario'}
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

        {/* CONTENIDO SUPER ADMIN */}
        {user.rol === 'super_admin' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: LISTA DE ACADEMIAS (8 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-texto)' }}>Academias</h2>
                  <p className="text-xs" style={{ color: 'var(--color-atenuado)' }}>
                    Gestiona los portales independientes instalados en el motor
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateAcademiaModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-verde)',
                    color: 'var(--color-fondo)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Academia
                </button>
              </div>

              {errorAcademias && (
                <div className="p-4 rounded-xl text-sm border flex items-center gap-3"
                  style={{ 
                    backgroundColor: 'rgba(255, 107, 107, 0.08)', 
                    borderColor: 'rgba(255, 107, 107, 0.2)',
                    color: 'var(--color-rojo)'
                  }}>
                  <span>{errorAcademias}</span>
                </div>
              )}

              {loadingAcademias ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin h-8 w-8 animate-duration-750" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-verde)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : academias.length === 0 ? (
                <div className="p-12 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--color-linea)' }}>
                  <p style={{ color: 'var(--color-atenuado)' }}>No hay academias creadas todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {academias.map((academy) => {
                    const isSelected = selectedAcademia?.id === academy.id;
                    return (
                      <div
                        key={academy.id}
                        onClick={() => setSelectedAcademia(academy)}
                        className="p-5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col gap-4 group"
                        style={{
                          backgroundColor: isSelected ? 'rgba(20, 26, 24, 0.8)' : 'rgba(20, 26, 24, 0.4)',
                          borderColor: isSelected ? academy.color_acento : 'var(--color-linea)',
                          boxShadow: isSelected ? `0 4px 20px -5px ${academy.color_acento}40` : 'none'
                        }}
                      >
                        {/* Glow de color al hacer hover */}
                        <div className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                          style={{ backgroundColor: academy.color_acento }} />

                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: academy.color_acento }} />
                            <h3 className="font-bold text-sm tracking-tight" style={{ color: 'var(--color-texto)' }}>
                              {academy.nombre}
                            </h3>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
                            style={{ 
                              backgroundColor: academy.activa ? 'rgba(61, 214, 140, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                              color: academy.activa ? 'var(--color-verde)' : 'var(--color-rojo)'
                            }}>
                            {academy.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs line-clamp-2 min-h-[32px]" style={{ color: 'var(--color-atenuado)' }}>
                            {academy.descripcion || 'Sin descripción disponible.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--color-linea)' }}>
                          <span className="text-[11px] font-mono" style={{ color: 'var(--color-atenuado)' }}>
                            /{academy.slug}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--color-verde)' }}>
                            Gestionar {isSelected ? '▶' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: ADMINISTRADORES DE LA ACADEMIA SELECCIONADA (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6 p-6 rounded-xl border"
              style={{
                backgroundColor: 'rgba(11, 15, 14, 0.4)',
                borderColor: 'var(--color-linea)'
              }}
            >
              {selectedAcademia ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--color-linea)' }}>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--color-texto)' }}>
                        Administradores
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--color-atenuado)' }}>
                        Gestores de <strong>{selectedAcademia.nombre}</strong>
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowCreateAdminModal(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1.5 border"
                      style={{
                        borderColor: selectedAcademia.color_acento,
                        color: selectedAcademia.color_acento,
                        backgroundColor: `${selectedAcademia.color_acento}08`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${selectedAcademia.color_acento}15`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${selectedAcademia.color_acento}08`;
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar
                    </button>
                  </div>

                  {errorAdmins && (
                    <div className="p-3 rounded-lg text-xs border"
                      style={{ 
                        backgroundColor: 'rgba(255, 107, 107, 0.08)', 
                        borderColor: 'rgba(255, 107, 107, 0.2)',
                        color: 'var(--color-rojo)'
                      }}>
                      <span>{errorAdmins}</span>
                    </div>
                  )}

                  {loadingAdmins ? (
                    <div className="flex justify-center py-8">
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24" style={{ color: selectedAcademia.color_acento }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : admins.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs" style={{ color: 'var(--color-atenuado)' }}>
                        No hay administradores registrados para esta academia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="p-3.5 rounded-lg border flex justify-between items-center"
                          style={{
                            backgroundColor: 'rgba(20, 26, 24, 0.3)',
                            borderColor: 'var(--color-linea)'
                          }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold" style={{ color: 'var(--color-texto)' }}>
                              {admin.nombre || 'Sin Nombre'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-atenuado)' }}>
                              {admin.email}
                            </span>
                          </div>
                          
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
                            style={{ 
                              backgroundColor: admin.activo ? 'rgba(61, 214, 140, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                              color: admin.activo ? 'var(--color-verde)' : 'var(--color-rojo)'
                            }}>
                            {admin.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <svg className="w-12 h-12" style={{ color: 'var(--color-atenuado)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-texto)' }}>Selecciona una Academia</h3>
                    <p className="text-xs mt-1 max-w-[200px]" style={{ color: 'var(--color-atenuado)' }}>
                      Haz clic en una academia de la izquierda para ver y gestionar sus administradores.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* VISTA INICIAL PARA ROLES ADMIN_ACADEMIA / ESTUDIANTE (PANEL BÁSICO) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(11, 15, 14, 0.4)', borderColor: 'var(--color-linea)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-atenuado)' }}>ID de Usuario</h3>
              <p className="font-mono text-sm break-all" style={{ color: 'var(--color-texto)' }}>{user.usuario_id}</p>
            </div>

            <div className="p-6 rounded-xl border flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(11, 15, 14, 0.4)', borderColor: 'var(--color-linea)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-atenuado)' }}>ID de Academia (Tenant)</h3>
              <p className="font-mono text-sm" style={{ color: user.academia_id ? 'var(--color-texto)' : 'var(--color-atenuado)' }}>
                {user.academia_id || 'NULL (Global)'}
              </p>
            </div>

            <div className="p-6 rounded-xl border flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(11, 15, 14, 0.4)', borderColor: 'var(--color-linea)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-atenuado)' }}>Permisos</h3>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-verde)' }}>
                Acceso de Rol: {user.rol}
              </p>
            </div>
          </div>
        )}

        {/* METADATOS DEL SERVIDOR */}
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
              {user.rol === 'super_admin' 
                ? 'Conectado a Neon PostgreSQL en modo agrupado (PgBouncer). Puedes registrar nuevas academias y habilitar administradores en tiempo real.' 
                : 'La autenticación mediante JWT ha sido validada de extremo a extremo para tu rol.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREAR ACADEMIA */}
      {/* ========================================================================= */}
      {showCreateAcademiaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border flex flex-col gap-6"
            style={{ 
              backgroundColor: 'var(--color-superficie)', 
              borderColor: 'var(--color-linea)' 
            }}
          >
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--color-linea)' }}>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-texto)' }}>Nueva Academia</h3>
              <button 
                onClick={() => setShowCreateAcademiaModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formErrorAcademia && (
              <div className="p-3 rounded-lg text-xs border"
                style={{ 
                  backgroundColor: 'rgba(255, 107, 107, 0.08)', 
                  borderColor: 'rgba(255, 107, 107, 0.2)',
                  color: 'var(--color-rojo)'
                }}>
                <span>{formErrorAcademia}</span>
              </div>
            )}

            <form onSubmit={handleCreateAcademia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                  Nombre de la Academia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Apuesta con cabeza"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.6)',
                    borderColor: 'var(--color-linea)',
                    color: 'var(--color-texto)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                  Slug (URL Amigable)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej-apuesta-con-cabeza"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.6)',
                    borderColor: 'var(--color-linea)',
                    color: 'var(--color-texto)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                  Descripción
                </label>
                <textarea
                  placeholder="Descripción breve de los cursos o el propósito..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.6)',
                    borderColor: 'var(--color-linea)',
                    color: 'var(--color-texto)',
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                    URL del Logo (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                    style={{
                      backgroundColor: 'rgba(11, 15, 14, 0.6)',
                      borderColor: 'var(--color-linea)',
                      color: 'var(--color-texto)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                    Color Acento
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={colorAcento}
                      onChange={(e) => setColorAcento(e.target.value)}
                      className="w-10 h-10 border-0 outline-none rounded-xl cursor-pointer p-0"
                      style={{ backgroundColor: 'transparent' }}
                    />
                    <span className="text-[10px] font-mono">{colorAcento}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: 'var(--color-linea)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateAcademiaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.4)',
                    color: 'var(--color-texto)',
                    border: '1px solid var(--color-linea)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingAcademia}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-verde)',
                    color: 'var(--color-fondo)',
                    opacity: creatingAcademia ? 0.7 : 1
                  }}
                >
                  {creatingAcademia ? 'Creando...' : 'Crear Academia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR ADMINISTRADOR */}
      {/* ========================================================================= */}
      {showCreateAdminModal && selectedAcademia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border flex flex-col gap-6"
            style={{ 
              backgroundColor: 'var(--color-superficie)', 
              borderColor: 'var(--color-linea)' 
            }}
          >
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--color-linea)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-texto)' }}>Nuevo Administrador</h3>
                <p className="text-xs" style={{ color: 'var(--color-atenuado)' }}>
                  Asignar a la academia: <strong style={{ color: selectedAcademia.color_acento }}>{selectedAcademia.nombre}</strong>
                </p>
              </div>
              <button 
                onClick={() => setShowCreateAdminModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formErrorAdmin && (
              <div className="p-3 rounded-lg text-xs border"
                style={{ 
                  backgroundColor: 'rgba(255, 107, 107, 0.08)', 
                  borderColor: 'rgba(255, 107, 107, 0.2)',
                  color: 'var(--color-rojo)'
                }}>
                <span>{formErrorAdmin}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={adminNombre}
                  onChange={(e) => setAdminNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.6)',
                    borderColor: 'var(--color-linea)',
                    color: 'var(--color-texto)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="juan.perez@ejemplo.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.6)',
                    borderColor: 'var(--color-linea)',
                    color: 'var(--color-texto)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-atenuado)' }}>
                  Contraseña Temporal
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-[rgba(61,214,140,0.15)] focus:border-[#3DD68C]"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.6)',
                    borderColor: 'var(--color-linea)',
                    color: 'var(--color-texto)',
                  }}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: 'var(--color-linea)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(11, 15, 14, 0.4)',
                    color: 'var(--color-texto)',
                    border: '1px solid var(--color-linea)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: selectedAcademia.color_acento,
                    color: 'var(--color-fondo)',
                    opacity: creatingAdmin ? 0.7 : 1
                  }}
                >
                  {creatingAdmin ? 'Guardando...' : 'Crear Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
