import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  LogOut,
  Users,
  CheckCircle2,
  Globe,
  Database,
  Loader2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

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
  
  // Estado Selección
  const [selectedAcademia, setSelectedAcademia] = useState<Academia | null>(null);
  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

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

  // Formulario de Nuevo Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

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
    try {
      const data = await getAcademias(token);
      setAcademias(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar las academias.');
    } finally {
      setLoadingAcademias(false);
    }
  };

  const loadAdmins = async (academiaId: string) => {
    setLoadingAdmins(true);
    try {
      const data = await getAcademiaAdmins(token, academiaId);
      setAdmins(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar los administradores.');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateAcademia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !slug) {
      toast.error('El nombre y el slug son obligatorios.');
      return;
    }

    setCreatingAcademia(true);
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
      toast.success(`Academia "${nombre}" creada exitosamente.`);
      
      // Reset campos
      setNombre('');
      setSlug('');
      setDescripcion('');
      setLogoUrl('');
      setColorAcento('#3DD68C');
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error al crear la academia.');
    } finally {
      setCreatingAcademia(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcademia) return;
    if (!adminEmail || !adminPassword || !adminNombre) {
      toast.error('Todos los campos son obligatorios.');
      return;
    }

    setCreatingAdmin(true);
    try {
      const nuevoAdmin = await createAcademiaAdmin(token, selectedAcademia.id, {
        email: adminEmail,
        password: adminPassword,
        nombre: adminNombre
      });
      setAdmins((prev) => [nuevoAdmin, ...prev]);
      setShowCreateAdminModal(false);
      toast.success(`Administrador "${adminNombre}" registrado con éxito.`);
      
      // Reset campos
      setAdminEmail('');
      setAdminPassword('');
      setAdminNombre('');
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error al registrar el administrador.');
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-6xl p-6 md:p-8 rounded-3xl border glassmorphism relative overflow-hidden"
    >
      {/* Orbes de luz decorativos flotantes de fondo */}
      <div 
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] transition-all duration-700 ease-out pointer-events-none animate-pulse-slow"
        style={{ 
          backgroundColor: selectedAcademia ? `${selectedAcademia.color_acento}1e` : 'var(--color-verde)1c',
        }} 
      />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none bg-blue-500/10" />

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* HEADER DE CONTROL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-linea)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#3DD68C]">
                {user.rol === 'super_admin' ? 'Administrador Global' : 'Panel de Control'}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1 text-[#E7EDEA]">
              Motor Academias
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#E7EDEA]">
                {user.rol === 'super_admin' ? 'Carlos' : 'Usuario'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full mt-1 border bg-emerald-500/5 border-emerald-500/20 text-[#3DD68C]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.rol}
              </span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="p-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {user.rol === 'super_admin' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: LISTA DE ACADEMIAS (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#E7EDEA] flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#3DD68C]" />
                    Academias
                  </h2>
                  <p className="text-xs text-[#73827C]">
                    Portales independientes instalados en el motor multi-inquilino
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateAcademiaModal(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-300 flex items-center gap-2 bg-[#3DD68C] text-[#0B0F0E] shadow-[0_4px_20px_-5px_rgba(61,214,140,0.4)]"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Nueva Academia
                </motion.button>
              </div>

              {loadingAcademias ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3DD68C]" />
                </div>
              ) : academias.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center rounded-2xl border border-dashed border-[#26302C]"
                >
                  <p className="text-sm text-[#73827C]">No hay academias creadas todavía. Crea una para comenzar.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
                  {academias.map((academy, index) => {
                    const isSelected = selectedAcademia?.id === academy.id;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={academy.id}
                        onClick={() => setSelectedAcademia(academy)}
                        className={`p-5 rounded-2xl border glassmorphism-hover cursor-pointer relative overflow-hidden flex flex-col gap-4 group ${
                          isSelected ? 'bg-[#141A18]/80' : 'bg-[#141A18]/30'
                        }`}
                        style={{
                          borderColor: isSelected ? academy.color_acento : 'var(--color-linea)',
                          boxShadow: isSelected ? `0 8px 30px -10px ${academy.color_acento}40` : 'none'
                        }}
                      >
                        {/* Glow de color del acento de la academia */}
                        <div 
                          className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full blur-2xl opacity-5 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none"
                          style={{ backgroundColor: academy.color_acento }} 
                        />

                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: academy.color_acento }} />
                            <h3 className="font-bold text-sm tracking-tight text-[#E7EDEA]">
                              {academy.nombre}
                            </h3>
                          </div>
                          
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                            academy.activa 
                              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/5 border-red-500/10 text-red-400'
                          }`}>
                            {academy.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-[#73827C] line-clamp-2 min-h-[32px]">
                            {academy.descripcion || 'Sin descripción disponible.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#26302C] pt-3">
                          <span className="text-[11px] font-mono text-[#73827C] bg-[#0B0F0E]/40 px-2 py-0.5 rounded-md">
                            /{academy.slug}
                          </span>
                          
                          <span className="text-[10px] font-bold flex items-center gap-0.5 text-emerald-400 transition-transform group-hover:translate-x-0.5 duration-200">
                            Gestionar <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: ADMINISTRADORES DE LA ACADEMIA SELECCIONADA (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6 p-6 rounded-2xl border bg-[#0B0F0E]/30 border-[#26302C]">
              {selectedAcademia ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-[#26302C]">
                    <div>
                      <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#3DD68C]" />
                        Administradores
                      </h3>
                      <p className="text-xs text-[#73827C]">
                        Gestores de <strong className="text-[#E7EDEA]">{selectedAcademia.nombre}</strong>
                      </p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowCreateAdminModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 flex items-center gap-1 border"
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
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </motion.button>
                  </div>

                  {loadingAdmins ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: selectedAcademia.color_acento }} />
                    </div>
                  ) : admins.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-xs text-[#73827C]">
                        No hay administradores registrados para esta academia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {admins.map((admin, index) => (
                        <motion.div
                          initial={{ opacity: 0, x: 5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={admin.id}
                          className="p-3.5 rounded-xl border border-[#26302C] bg-[#141A18]/30 flex justify-between items-center"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-[#E7EDEA]">
                              {admin.nombre || 'Sin Nombre'}
                            </span>
                            <span className="text-xs text-[#73827C]">
                              {admin.email}
                            </span>
                          </div>
                          
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                            admin.activo 
                              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/5 border-red-500/10 text-red-400'
                          }`}>
                            {admin.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                  <div className="p-4 rounded-full bg-[#141A18]/50 border border-[#26302C] animate-float">
                    <Globe className="w-8 h-8 text-[#73827C]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#E7EDEA]">Selecciona una Academia</h3>
                    <p className="text-xs text-[#73827C] mt-1.5 max-w-[240px] leading-relaxed">
                      Elige una academia de la izquierda para ver y gestionar su equipo de administradores.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* PANEL BÁSICO PARA ROLES ADMIN_ACADEMIA / ESTUDIANTE */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30 flex flex-col gap-2">
              <span className="text-xs font-bold text-[#73827C] uppercase tracking-wider">ID de Usuario</span>
              <p className="font-mono text-sm break-all text-[#E7EDEA]">{user.usuario_id}</p>
            </div>

            <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30 flex flex-col gap-2">
              <span className="text-xs font-bold text-[#73827C] uppercase tracking-wider">ID de Academia (Tenant)</span>
              <p className="font-mono text-sm text-[#E7EDEA]">{user.academia_id || 'NULL (Global)'}</p>
            </div>

            <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30 flex flex-col gap-2">
              <span className="text-xs font-bold text-[#73827C] uppercase tracking-wider">Permisos</span>
              <p className="text-sm font-bold text-[#3DD68C] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Rol: {user.rol}
              </p>
            </div>
          </div>
        )}

        {/* METADATOS DEL SERVIDOR */}
        <div className="p-5 rounded-2xl border border-sky-500/10 bg-sky-500/5 flex gap-4 items-start">
          <div className="p-2.5 rounded-xl bg-sky-500/10 flex-shrink-0 text-sky-400">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-sky-400">
              Estado de la Plataforma
            </h4>
            <p className="text-xs text-[#E7EDEA] leading-relaxed">
              {user.rol === 'super_admin' 
                ? 'Conectado a Neon PostgreSQL en modo agrupado (PgBouncer). Los túneles de seguridad JWT y políticas multi-tenant se encuentran validados y activos.' 
                : 'La autenticación mediante JWT ha sido validada de extremo a extremo para tu rol.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALES CON ANIMACIONES FRAMER MOTION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        
        {/* MODAL: NUEVA ACADEMIA */}
        {showCreateAcademiaModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C] bg-[#141A18]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#3DD68C]" />
                  Nueva Academia
                </h3>
                
                <button 
                  onClick={() => setShowCreateAcademiaModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E7EDEA] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateAcademia} className="space-y-4 mt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    Nombre de la Academia
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apuesta con cabeza"
                    value={nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    Slug (URL Amigable)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej-apuesta-con-cabeza"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    Descripción
                  </label>
                  <textarea
                    placeholder="Breve descripción..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                      URL del Logo
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                      Color Acento
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colorAcento}
                        onChange={(e) => setColorAcento(e.target.value)}
                        className="w-9 h-9 border-0 outline-none rounded-xl cursor-pointer p-0"
                        style={{ backgroundColor: 'transparent' }}
                      />
                      <span className="text-[10px] font-mono text-[#E7EDEA]">{colorAcento}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[#26302C] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAcademiaModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#0B0F0E]/40 text-[#E7EDEA] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAcademia}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                  >
                    {creatingAcademia && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Crear Academia
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: NUEVO ADMIN */}
        {showCreateAdminModal && selectedAcademia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C] bg-[#141A18]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <div>
                  <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                    <Plus className="w-5 h-5" style={{ color: selectedAcademia.color_acento }} />
                    Nuevo Administrador
                  </h3>
                  <p className="text-[11px] text-[#73827C] mt-0.5">
                    Asignar a la academia: <strong style={{ color: selectedAcademia.color_acento }}>{selectedAcademia.nombre}</strong>
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowCreateAdminModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E7EDEA] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4 mt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-[#73827C]" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={adminNombre}
                      onChange={(e) => setAdminNombre(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#73827C]" />
                    <input
                      type="email"
                      required
                      placeholder="juan.perez@ejemplo.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    Contraseña Temporal
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#73827C]" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[#26302C] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAdminModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#0B0F0E]/40 text-[#E7EDEA] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAdmin}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                    style={{
                      backgroundColor: selectedAcademia.color_acento,
                      color: 'var(--color-fondo)',
                      opacity: creatingAdmin ? 0.7 : 1
                    }}
                  >
                    {creatingAdmin && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Crear Administrador
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  );
}
