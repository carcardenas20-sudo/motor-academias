import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import {
  Plus,
  LogOut,
  Users,
  Globe,
  Database,
  Loader2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Settings,
  LayoutDashboard,
  Video,
  FileText,
  CheckSquare,
  Trash2,
  Edit3,
  Save,
  ChevronDown,
  Sparkles
} from 'lucide-react';

import type { TokenData } from '../services/auth';
import {
  getAcademias,
  createAcademia,
  getAcademiaAdmins,
  createAcademiaAdmin,
  getAcademiaPublicInfo,
  updateAcademia,
  getAcademia,
  type Academia,
  type AdminResponse
} from '../services/academias';
import {
  getCursos,
  createCurso,
  updateCurso,
  deleteCurso,
  getBloques,
  createBloque,
  updateBloque,
  deleteBloque,
  getPildoras,
  createPildora,
  updatePildora,
  deletePildora,
  getProgreso,
  toggleProgreso,
  type Curso,
  type Bloque,
  type Pildora,
  type Progreso
} from '../services/cursos';
import {
  getGamificacionPerfil,
  getLeaderboard,
  type GamificacionPerfil,
  type LeaderboardEntry
} from '../services/gamificacion';

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

  // Estados para Admin de Academia local (admin_academia)
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const [activeTabLocal, setActiveTabLocal] = useState<'resumen' | 'cursos' | 'ajustes'>('cursos');
  
  // Datos locales de la academia activa
  const [brand, setBrand] = useState<{ nombre: string; logo_url: string | null; color_acento: string } | null>(null);
  
  // Cursos, módulos y lecciones
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loadingBloques, setLoadingBloques] = useState(false);
  const [selectedBloque, setSelectedBloque] = useState<Bloque | null>(null);
  const [pildoras, setPildoras] = useState<Pildora[]>([]);
  const [loadingPildoras, setLoadingPildoras] = useState(false);

  // Estados de Estudiante
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [selectedPildora, setSelectedPildora] = useState<Pildora | null>(null);
  const [submittingProgreso, setSubmittingProgreso] = useState(false);

  // Estados de Gamificación
  const [perfilGamif, setPerfilGamif] = useState<GamificacionPerfil | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [isMembershipBlocked, setIsMembershipBlocked] = useState(false);

  // Modales de CRUD Local
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [cursoTitulo, setCursoTitulo] = useState('');
  const [cursoDescripcion, setCursoDescripcion] = useState('');
  const [cursoOrden, setCursoOrden] = useState(0);
  const [cursoPublicado, setCursoPublicado] = useState(false);
  const [submittingCurso, setSubmittingCurso] = useState(false);

  const [showBloqueModal, setShowBloqueModal] = useState(false);
  const [editingBloque, setEditingBloque] = useState<Bloque | null>(null);
  const [bloqueTitulo, setBloqueTitulo] = useState('');
  const [bloqueOrden, setBloqueOrden] = useState(0);
  const [submittingBloque, setSubmittingBloque] = useState(false);

  const [showPildoraModal, setShowPildoraModal] = useState(false);
  const [editingPildora, setEditingPildora] = useState<Pildora | null>(null);
  const [pildoraTitulo, setPildoraTitulo] = useState('');
  const [pildoraTipo, setPildoraTipo] = useState<'video' | 'texto' | 'prueba'>('video');
  const [pildoraContenido, setPildoraContenido] = useState('');
  const [pildoraDuracion, setPildoraDuracion] = useState(10);
  const [pildoraOrden, setPildoraOrden] = useState(0);
  const [pildoraPublicada, setPildoraPublicada] = useState(false);
  const [submittingPildora, setSubmittingPildora] = useState(false);

  // Formulario de ajustes de academia activa
  const [ajustesNombre, setAjustesNombre] = useState('');
  const [ajustesDescripcion, setAjustesDescripcion] = useState('');
  const [ajustesLogo, setAjustesLogo] = useState('');
  const [ajustesColor, setAjustesColor] = useState('#3DD68C');
  const [submittingAjustes, setSubmittingAjustes] = useState(false);

  // Cargar Branding y Ajustes
  useEffect(() => {
    if (user.rol === 'admin_academia' && user.academia_id && token) {
      getAcademia(token, user.academia_id)
        .then((info) => {
          setBrand(info);
          document.documentElement.style.setProperty('--color-verde', info.color_acento);
          setAjustesNombre(info.nombre);
          setAjustesDescripcion(info.descripcion || '');
          setAjustesLogo(info.logo_url || '');
          setAjustesColor(info.color_acento);
        })
        .catch((err) => console.error("Error al cargar configuración de la academia:", err));
    } else if (tenantSlug) {
      getAcademiaPublicInfo(tenantSlug)
        .then((info) => {
          setBrand(info);
          document.documentElement.style.setProperty('--color-verde', info.color_acento);
          setAjustesNombre(info.nombre);
          setAjustesLogo(info.logo_url || '');
          setAjustesColor(info.color_acento);
        })
        .catch((err) => console.error("Error al cargar branding:", err));
    }
  }, [tenantSlug, user.rol, user.academia_id, token]);

  // Cargar Cursos
  const loadCursosLocal = async () => {
    if (!user.academia_id) return;
    setLoadingCursos(true);
    try {
      const data = await getCursos(token, user.academia_id);
      setCursos(data);
    } catch (err: any) {
      if (err.message?.includes('membresía') || err.message?.includes('402') || err.message?.includes('Payment')) {
        setIsMembershipBlocked(true);
      } else {
        toast.error(err.message || 'Error al cargar los cursos.');
      }
    } finally {
      setLoadingCursos(false);
    }
  };

  // Cargar Bloques
  const loadBloquesLocal = async (cursoId: string) => {
    if (!user.academia_id) return;
    setLoadingBloques(true);
    try {
      const data = await getBloques(token, user.academia_id, cursoId);
      setBloques(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar los módulos.');
    } finally {
      setLoadingBloques(false);
    }
  };

  // Cargar Píldoras
  const loadPildorasLocal = async (bloqueId: string) => {
    if (!user.academia_id) return;
    setLoadingPildoras(true);
    try {
      const data = await getPildoras(token, user.academia_id, bloqueId);
      setPildoras(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar las lecciones.');
    } finally {
      setLoadingPildoras(false);
    }
  };

  // Cargar progreso del estudiante
  const loadProgresoLocal = async () => {
    if (!user.academia_id) return;
    try {
      const data = await getProgreso(token, user.academia_id);
      setProgreso(data);
    } catch (err: any) {
      if (err.message?.includes('membresía') || err.message?.includes('402') || err.message?.includes('Payment')) {
        setIsMembershipBlocked(true);
      } else {
        toast.error(err.message || 'Error al cargar el progreso.');
      }
    }
  };

  // Cargar Perfil de Gamificación
  const loadGamificacionPerfil = async () => {
    if (!user.academia_id) return;
    try {
      const data = await getGamificacionPerfil(token, user.academia_id);
      setPerfilGamif(data);
    } catch (err: any) {
      console.error('Error al cargar perfil de gamificación:', err);
    }
  };

  // Cargar Clasificación (Leaderboard)
  const loadLeaderboardLocal = async () => {
    if (!user.academia_id) return;
    setLoadingLeaderboard(true);
    try {
      const data = await getLeaderboard(token, user.academia_id);
      setLeaderboard(data);
    } catch (err: any) {
      console.error('Error al cargar la tabla de clasificación:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (user.rol === 'estudiante' && token) {
      loadProgresoLocal();
      loadGamificacionPerfil();
      loadLeaderboardLocal();
    }
  }, [user.rol, token]);

  useEffect(() => {
    if ((user.rol === 'admin_academia' || user.rol === 'estudiante') && token) {
      loadCursosLocal();
    }
  }, [user.rol, token]);

  // Outline especial para el estudiante que carga todo a la vez
  const loadCursoOutline = async (cursoId: string) => {
    if (!user.academia_id) return;
    setLoadingBloques(true);
    try {
      const blocksData = await getBloques(token, user.academia_id, cursoId);
      setBloques(blocksData);
      
      const allPills: Pildora[] = [];
      for (const b of blocksData) {
        const pillsData = await getPildoras(token, user.academia_id, b.id);
        allPills.push(...pillsData);
      }
      setPildoras(allPills);
    } catch (err: any) {
      toast.error('Error al cargar la estructura del curso.');
    } finally {
      setLoadingBloques(false);
    }
  };

  useEffect(() => {
    if (selectedCurso) {
      if (user.rol === 'estudiante') {
        loadCursoOutline(selectedCurso.id);
        setSelectedBloque(null);
        setSelectedPildora(null);
      } else {
        loadBloquesLocal(selectedCurso.id);
        setSelectedBloque(null);
        setPildoras([]);
      }
    } else {
      setBloques([]);
    }
  }, [selectedCurso, user.rol]);

  useEffect(() => {
    if (selectedBloque && user.rol !== 'estudiante') {
      loadPildorasLocal(selectedBloque.id);
    } else if (user.rol !== 'estudiante') {
      setPildoras([]);
    }
  }, [selectedBloque, user.rol]);

  // CRUD Curso
  const openCursoModal = (curso: Curso | null = null) => {
    setEditingCurso(curso);
    if (curso) {
      setCursoTitulo(curso.titulo);
      setCursoDescripcion(curso.descripcion || '');
      setCursoOrden(curso.orden);
      setCursoPublicado(curso.publicado);
    } else {
      setCursoTitulo('');
      setCursoDescripcion('');
      setCursoOrden(cursos.length);
      setCursoPublicado(false);
    }
    setShowCursoModal(true);
  };

  const handleCursoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoTitulo) {
      toast.error('El título es requerido.');
      return;
    }
    if (!user.academia_id) return;

    setSubmittingCurso(true);
    try {
      if (editingCurso) {
        const updated = await updateCurso(token, user.academia_id, editingCurso.id, {
          titulo: cursoTitulo,
          descripcion: cursoDescripcion,
          orden: cursoOrden,
          publicado: cursoPublicado
        });
        setCursos(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedCurso?.id === updated.id) {
          setSelectedCurso(updated);
        }
        toast.success('Curso actualizado correctamente.');
      } else {
        const newCurso = await createCurso(token, user.academia_id, {
          titulo: cursoTitulo,
          descripcion: cursoDescripcion,
          orden: cursoOrden,
          publicado: cursoPublicado
        });
        setCursos(prev => [...prev, newCurso]);
        toast.success('Curso creado con éxito.');
      }
      setShowCursoModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el curso.');
    } finally {
      setSubmittingCurso(false);
    }
  };

  const handleCursoDelete = async (cursoId: string) => {
    if (!user.academia_id) return;
    if (!confirm('¿Estás seguro de eliminar este curso? Se borrarán todos sus módulos y clases.')) return;

    try {
      await deleteCurso(token, user.academia_id, cursoId);
      setCursos(prev => prev.filter(c => c.id !== cursoId));
      if (selectedCurso?.id === cursoId) {
        setSelectedCurso(null);
      }
      toast.success('Curso eliminado.');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el curso.');
    }
  };

  // CRUD Bloque
  const openBloqueModal = (bloque: Bloque | null = null) => {
    setEditingBloque(bloque);
    if (bloque) {
      setBloqueTitulo(bloque.titulo);
      setBloqueOrden(bloque.orden);
    } else {
      setBloqueTitulo('');
      setBloqueOrden(bloques.length);
    }
    setShowBloqueModal(true);
  };

  const handleBloqueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloqueTitulo) {
      toast.error('El título es requerido.');
      return;
    }
    if (!user.academia_id || !selectedCurso) return;

    setSubmittingBloque(true);
    try {
      if (editingBloque) {
        const updated = await updateBloque(token, user.academia_id, editingBloque.id, {
          titulo: bloqueTitulo,
          orden: bloqueOrden
        });
        setBloques(prev => prev.map(b => b.id === updated.id ? updated : b));
        toast.success('Módulo actualizado.');
      } else {
        const newBloque = await createBloque(token, user.academia_id, selectedCurso.id, {
          titulo: bloqueTitulo,
          orden: bloqueOrden
        });
        setBloques(prev => [...prev, newBloque]);
        toast.success('Módulo creado.');
      }
      setShowBloqueModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el módulo.');
    } finally {
      setSubmittingBloque(false);
    }
  };

  const handleBloqueDelete = async (bloqueId: string) => {
    if (!user.academia_id) return;
    if (!confirm('¿Estás seguro de eliminar este módulo? Se perderán las lecciones asociadas.')) return;

    try {
      await deleteBloque(token, user.academia_id, bloqueId);
      setBloques(prev => prev.filter(b => b.id !== bloqueId));
      if (selectedBloque?.id === bloqueId) {
        setSelectedBloque(null);
      }
      toast.success('Módulo eliminado.');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el módulo.');
    }
  };

  // CRUD Pildora
  const openPildoraModal = (pildora: Pildora | null = null) => {
    setEditingPildora(pildora);
    if (pildora) {
      setPildoraTitulo(pildora.titulo);
      setPildoraTipo(pildora.tipo);
      setPildoraContenido(pildora.contenido || '');
      setPildoraDuracion(pildora.duracion_min || 0);
      setPildoraOrden(pildora.orden);
      setPildoraPublicada(pildora.publicada);
    } else {
      setPildoraTitulo('');
      setPildoraTipo('video');
      setPildoraContenido('');
      setPildoraDuracion(10);
      setPildoraOrden(pildoras.length);
      setPildoraPublicada(false);
    }
    setShowPildoraModal(true);
  };

  const handlePildoraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pildoraTitulo) {
      toast.error('El título es requerido.');
      return;
    }
    if (!user.academia_id || !selectedBloque) return;

    setSubmittingPildora(true);
    try {
      if (editingPildora) {
        const updated = await updatePildora(token, user.academia_id, editingPildora.id, {
          titulo: pildoraTitulo,
          tipo: pildoraTipo,
          contenido: pildoraContenido,
          duracion_min: pildoraDuracion,
          orden: pildoraOrden,
          publicada: pildoraPublicada
        });
        setPildoras(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success('Lección actualizada.');
      } else {
        const newPildora = await createPildora(token, user.academia_id, selectedBloque.id, {
          titulo: pildoraTitulo,
          tipo: pildoraTipo,
          contenido: pildoraContenido,
          duracion_min: pildoraDuracion,
          orden: pildoraOrden,
          publicada: pildoraPublicada
        });
        setPildoras(prev => [...prev, newPildora]);
        toast.success('Lección creada.');
      }
      setShowPildoraModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la lección.');
    } finally {
      setSubmittingPildora(false);
    }
  };

  const handlePildoraDelete = async (pildoraId: string) => {
    if (!user.academia_id) return;
    if (!confirm('¿Estás seguro de eliminar esta lección?')) return;

    try {
      await deletePildora(token, user.academia_id, pildoraId);
      setPildoras(prev => prev.filter(p => p.id !== pildoraId));
      toast.success('Lección eliminada.');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la lección.');
    }
  };

  // Guardar Ajustes
  const handleAjustesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajustesNombre) {
      toast.error('El nombre de la academia es requerido.');
      return;
    }
    if (!user.academia_id) return;

    setSubmittingAjustes(true);
    try {
      const updated = await updateAcademia(token, user.academia_id, {
        nombre: ajustesNombre,
        descripcion: ajustesDescripcion,
        logo_url: ajustesLogo || undefined,
        color_acento: ajustesColor
      });
      setBrand(updated);
      document.documentElement.style.setProperty('--color-verde', updated.color_acento);
      toast.success('Ajustes de marca actualizados.');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los ajustes.');
    } finally {
      setSubmittingAjustes(false);
    }
  };

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

  const isPildoraCompletada = (pildoraId: string): boolean => {
    return progreso.some(p => p.pildora_id === pildoraId && p.completada);
  };

  const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.substring(url.indexOf('?')));
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleToggleProgreso = async (pildoraId: string, currentStatus: boolean) => {
    if (!user.academia_id) return;
    setSubmittingProgreso(true);
    try {
      const nextStatus = !currentStatus;
      const updated = await toggleProgreso(token, user.academia_id, pildoraId, nextStatus);
      
      // Actualizar state
      setProgreso(prev => {
        const exists = prev.some(p => p.pildora_id === pildoraId);
        if (exists) {
          return prev.map(p => p.pildora_id === pildoraId ? updated : p);
        } else {
          return [...prev, updated];
        }
      });
      
      toast.success(nextStatus ? '¡Clase completada!' : 'Clase marcada como pendiente.');
      
      // Recargar gamificación y clasificaciones
      loadGamificacionPerfil();
      loadLeaderboardLocal();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar progreso.');
    } finally {
      setSubmittingProgreso(false);
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
            {user.rol === 'estudiante' && perfilGamif && (
              <div className="flex items-center gap-3 mr-2 bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-1.5 rounded-2xl">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-[#73827C] font-bold uppercase tracking-wider">Nivel {perfilGamif.nivel}</span>
                  <span className="text-xs font-black text-[#E7EDEA]">{perfilGamif.puntos} PTS</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#3DD68C]/10 flex items-center justify-center text-[#3DD68C]">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            )}
            
            <div className="text-right">
              <p className="text-sm font-semibold text-[#E7EDEA]">
                {user.rol === 'super_admin' ? 'Carlos' : user.rol === 'estudiante' ? 'Estudiante' : 'Usuario'}
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
        ) : user.rol === 'admin_academia' ? (
          /* PANEL COMPLETO DE ADMINISTRADOR DE ACADEMIA LOCAL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: MENÚ SIDEBAR LOCAL (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <button
                onClick={() => setActiveTabLocal('resumen')}
                className={`w-full p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 text-sm font-bold ${
                  activeTabLocal === 'resumen'
                    ? 'bg-[#141A18]/80 text-[#E7EDEA]'
                    : 'bg-[#141A18]/20 border-transparent text-[#73827C] hover:bg-[#141A18]/40 hover:text-[#E7EDEA]'
                }`}
                style={{ borderColor: activeTabLocal === 'resumen' ? 'var(--color-verde)' : 'transparent' }}
              >
                <LayoutDashboard className="w-5 h-5" />
                Resumen
              </button>
              
              <button
                onClick={() => setActiveTabLocal('cursos')}
                className={`w-full p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 text-sm font-bold ${
                  activeTabLocal === 'cursos'
                    ? 'bg-[#141A18]/80 text-[#E7EDEA]'
                    : 'bg-[#141A18]/20 border-transparent text-[#73827C] hover:bg-[#141A18]/40 hover:text-[#E7EDEA]'
                }`}
                style={{ borderColor: activeTabLocal === 'cursos' ? 'var(--color-verde)' : 'transparent' }}
              >
                <BookOpen className="w-5 h-5" />
                Plan de Estudios
              </button>

              <button
                onClick={() => setActiveTabLocal('ajustes')}
                className={`w-full p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 text-sm font-bold ${
                  activeTabLocal === 'ajustes'
                    ? 'bg-[#141A18]/80 text-[#E7EDEA]'
                    : 'bg-[#141A18]/20 border-transparent text-[#73827C] hover:bg-[#141A18]/40 hover:text-[#E7EDEA]'
                }`}
                style={{ borderColor: activeTabLocal === 'ajustes' ? 'var(--color-verde)' : 'transparent' }}
              >
                <Settings className="w-5 h-5" />
                Ajustes de Marca
              </button>

              {/* Info de la Academia Activa */}
              {brand && (
                <div className="mt-6 p-4 rounded-2xl border border-[#26302C] bg-[#141A18]/20 text-center flex flex-col items-center gap-3">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.nombre} className="w-16 h-16 object-contain rounded-xl" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xl">
                      {brand.nombre[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-xs text-[#E7EDEA]">{brand.nombre}</h4>
                    <p className="text-[10px] text-[#73827C] mt-1 font-mono">/{tenantSlug}</p>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: CONTENIDO DE LA PESTAÑA (9 cols) */}
            <div className="lg:col-span-9">
              {activeTabLocal === 'resumen' && (
                <div className="space-y-6">
                  {/* Tarjetas de estadísticas rápidas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30">
                      <h4 className="text-xs font-bold text-[#73827C] uppercase tracking-wider mb-2">Cursos Activos</h4>
                      <p className="text-3xl font-black text-[#E7EDEA]">{cursos.length}</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30">
                      <h4 className="text-xs font-bold text-[#73827C] uppercase tracking-wider mb-2">Total Módulos</h4>
                      <p className="text-3xl font-black text-[#E7EDEA]">
                        {bloques.length || '-'}
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30">
                      <h4 className="text-xs font-bold text-[#73827C] uppercase tracking-wider mb-2">Estudiantes Estimados</h4>
                      <p className="text-3xl font-black text-[#E7EDEA]">3</p>
                    </div>
                  </div>

                  {/* Panel de Bienvenida */}
                  <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30 space-y-4">
                    <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                      ¡Bienvenido al panel de tu academia!
                    </h3>
                    <p className="text-xs text-[#73827C] leading-relaxed">
                      Desde aquí puedes gestionar todo el contenido educativo que tus estudiantes verán al entrar.
                      Utiliza la pestaña de **Plan de Estudios** para subir tus videos y lecturas, u organiza los temas de tus módulos.
                    </p>
                  </div>
                </div>
              )}

              {activeTabLocal === 'ajustes' && (
                <div className="p-6 rounded-2xl border border-[#26302C] bg-[#141A18]/30 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#E7EDEA]">Personalizar Marca</h3>
                    <p className="text-xs text-[#73827C] mt-1">Configura los aspectos visuales e identitarios de tu academia.</p>
                  </div>

                  <form onSubmit={handleAjustesSubmit} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Nombre de la Academia</label>
                      <input
                        type="text"
                        required
                        value={ajustesNombre}
                        onChange={(e) => setAjustesNombre(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Descripción</label>
                      <textarea
                        value={ajustesDescripcion}
                        onChange={(e) => setAjustesDescripcion(e.target.value)}
                        rows={3}
                        placeholder="Describe de qué trata tu academia..."
                        className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">URL del Logotipo</label>
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/logo.png"
                        value={ajustesLogo}
                        onChange={(e) => setAjustesLogo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Color de Acento de la Interfaz</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={ajustesColor}
                          onChange={(e) => setAjustesColor(e.target.value)}
                          className="w-10 h-10 border-0 outline-none rounded-xl cursor-pointer p-0 bg-transparent"
                        />
                        <span className="font-mono text-xs text-[#73827C] uppercase">{ajustesColor}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAjustes}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submittingAjustes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Guardar Cambios
                    </button>
                  </form>
                </div>
              )}

              {activeTabLocal === 'cursos' && (
                <div className="space-y-6">
                  {/* Vista Plan de Estudios */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#E7EDEA]">Plan de Estudios</h3>
                      <p className="text-xs text-[#73827C] mt-0.5">Administra los cursos, módulos y clases de tu academia.</p>
                    </div>
                    <button
                      onClick={() => openCursoModal()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Curso
                    </button>
                  </div>

                  {loadingCursos ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3DD68C]" />
                    </div>
                  ) : cursos.length === 0 ? (
                    <div className="p-16 text-center border border-dashed border-[#26302C] rounded-2xl">
                      <p className="text-sm text-[#73827C]">No hay cursos creados en esta academia. Haz clic en 'Nuevo Curso' para empezar.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Sub-columna 1: Lista de Cursos (5 cols) */}
                      <div className="md:col-span-5 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#73827C]">Listado de Cursos</span>
                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                          {cursos.map(c => {
                            const isSelected = selectedCurso?.id === c.id;
                            return (
                              <div
                                key={c.id}
                                onClick={() => setSelectedCurso(c)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${
                                  isSelected
                                    ? 'bg-[#141A18]/80 border-emerald-500/30'
                                    : 'bg-[#141A18]/10 border-[#26302C] hover:bg-[#141A18]/30'
                                }`}
                              >
                                <div className="flex flex-col gap-1 pr-8">
                                  <h4 className="font-bold text-xs text-[#E7EDEA] line-clamp-1">{c.titulo}</h4>
                                  <span className={`text-[9px] w-max px-1.5 py-0.5 rounded font-bold uppercase border ${
                                    c.publicado
                                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                                      : 'bg-yellow-500/5 border-yellow-500/10 text-yellow-400'
                                  }`}>
                                    {c.publicado ? 'Publicado' : 'Borrador'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openCursoModal(c); }}
                                    className="p-1 rounded bg-[#26302C] text-[#73827C] hover:text-[#E7EDEA] transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCursoDelete(c.id); }}
                                    className="p-1 rounded bg-[#26302C] text-[#73827C] hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sub-columna 2: Plan Curricular Detallado (7 cols) */}
                      <div className="md:col-span-7">
                        {selectedCurso ? (
                          <div className="space-y-4 p-5 rounded-2xl border border-[#26302C] bg-[#141A18]/20">
                            {/* Cabecera del Curso */}
                            <div className="flex justify-between items-start pb-3 border-b border-[#26302C]">
                              <div>
                                <h4 className="text-sm font-bold text-[#E7EDEA]">{selectedCurso.titulo}</h4>
                                <p className="text-[11px] text-[#73827C] mt-1 line-clamp-2">{selectedCurso.descripcion || 'Sin descripción.'}</p>
                              </div>
                              <button
                                onClick={() => openBloqueModal()}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Módulo
                              </button>
                            </div>

                            {/* Lista de Módulos (Bloques) */}
                            {loadingBloques ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-[#3DD68C]" />
                              </div>
                            ) : bloques.length === 0 ? (
                              <p className="text-xs text-[#73827C] text-center py-6">Este curso aún no tiene módulos. Crea uno para agrupar tus lecciones.</p>
                            ) : (
                              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                                {bloques.map(b => {
                                  const isBloqueSelected = selectedBloque?.id === b.id;
                                  return (
                                    <div key={b.id} className="border border-[#26302C] rounded-xl bg-[#0b0f0e]/30 overflow-hidden">
                                      {/* Cabecera Módulo */}
                                      <div
                                        onClick={() => setSelectedBloque(isBloqueSelected ? null : b)}
                                        className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-[#141A18]/40 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isBloqueSelected ? <ChevronDown className="w-4 h-4 text-[#3DD68C]" /> : <ChevronRight className="w-4 h-4 text-[#73827C]" />}
                                          <span className="text-xs font-bold text-[#E7EDEA]">{b.titulo}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); openPildoraModal(); setSelectedBloque(b); }}
                                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold hover:bg-emerald-500/20 border border-emerald-500/10 flex items-center gap-0.5"
                                          >
                                            <Plus className="w-3 h-3" /> Clase
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); openBloqueModal(b); }}
                                            className="p-1 rounded bg-[#26302C] text-[#73827C] hover:text-[#E7EDEA] transition-colors"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleBloqueDelete(b.id); }}
                                            className="p-1 rounded bg-[#26302C] text-[#73827C] hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Clases del Módulo (Píldoras) */}
                                      {isBloqueSelected && (
                                        <div className="border-t border-[#26302C] p-3 bg-[#0b0f0e]/10 space-y-2">
                                          {loadingPildoras ? (
                                            <div className="flex justify-center py-4">
                                              <Loader2 className="w-5 h-5 animate-spin text-[#3DD68C]" />
                                            </div>
                                          ) : pildoras.length === 0 ? (
                                            <p className="text-[10px] text-[#73827C] italic pl-6">Sin clases cargadas todavía.</p>
                                          ) : (
                                            pildoras.map(p => (
                                              <div key={p.id} className="pl-6 py-2 pr-2 border-b border-[#26302C]/40 last:border-b-0 flex justify-between items-center group/pildora">
                                                <div className="flex items-center gap-2">
                                                  {p.tipo === 'video' ? <Video className="w-3.5 h-3.5 text-[#3DD68C]" /> : <FileText className="w-3.5 h-3.5 text-blue-400" />}
                                                  <div className="flex flex-col">
                                                    <span className="text-xs text-[#E7EDEA] font-semibold">{p.titulo}</span>
                                                    <span className="text-[9px] text-[#73827C] mt-0.5">{p.duracion_min || 0} min | {p.publicada ? 'Pública' : 'Borrador'}</span>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/pildora:opacity-100 transition-opacity">
                                                  <button
                                                    onClick={() => openPildoraModal(p)}
                                                    className="p-1 rounded bg-[#26302C] text-[#73827C] hover:text-[#E7EDEA] transition-colors"
                                                  >
                                                    <Edit3 className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handlePildoraDelete(p.id)}
                                                    className="p-1 rounded bg-[#26302C] text-[#73827C] hover:text-red-400 transition-colors"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed border-[#26302C] rounded-2xl bg-[#141A18]/10">
                            <BookOpen className="w-8 h-8 text-[#73827C] animate-float" />
                            <div>
                              <h4 className="text-xs font-bold text-[#E7EDEA]">Estructura de Contenidos</h4>
                              <p className="text-[10px] text-[#73827C] mt-1 max-w-[200px]">Selecciona un curso a la izquierda para administrar sus módulos y lecciones.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : isMembershipBlocked ? (
          /* PANTALLA DE PAYWALL PREMIUM */
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto gap-6 border border-[#26302C] bg-[#141A18]/20 rounded-3xl p-8 relative overflow-hidden w-full">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-10 pointer-events-none"
              style={{ backgroundColor: 'var(--color-verde)' }}
            />
            
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-float">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="text-xl font-black text-[#E7EDEA]">Acceso Premium Requerido</h2>
              <p className="text-xs text-[#73827C] leading-relaxed">
                No tienes una membresía activa en <span className="font-bold text-[#E7EDEA]">{brand?.nombre || 'esta academia'}</span>.
                Adquiere tu plan para desbloquear todos los cursos, lecciones interactivas y ver tu posición en el ranking de estudiantes.
              </p>
            </div>

            {/* Simulación del Webhook de Hotmart */}
            <div className="w-full p-4 rounded-2xl border border-[#26302C] bg-[#0b0f0e]/50 text-left space-y-3 relative z-10">
              <span className="text-[9px] uppercase font-mono text-[#73827C] font-bold">Simulador de Pago (Entorno de Pruebas)</span>
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[#73827C]">CORREO A ENVIAR AL WEBHOOK</label>
                <input
                  type="text"
                  readOnly
                  value={user.email}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#26302C] outline-none text-xs bg-[#141A18]/50 text-[#73827C]"
                />
              </div>
              
              <button
                onClick={async () => {
                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                  setSubmittingProgreso(true); // Reutilizar spinner
                  try {
                    const res = await fetch(`${API_URL}/academias/${user.academia_id}/webhook/hotmart`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event: 'PURCHASE_APPROVED',
                        buyer: {
                          email: user.email,
                          name: 'Estudiante Premium'
                        }
                      })
                    });
                    if (!res.ok) throw new Error('Error al procesar el webhook');
                    toast.success('¡Webhook enviado! Compra simulada aprobada.');
                    
                    // Reactivar acceso y recargar todo
                    setIsMembershipBlocked(false);
                    loadCursosLocal();
                    loadProgresoLocal();
                    loadGamificacionPerfil();
                    loadLeaderboardLocal();
                  } catch (err: any) {
                    toast.error('Ocurrió un error al simular la compra.');
                  } finally {
                    setSubmittingProgreso(false);
                  }
                }}
                disabled={submittingProgreso}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingProgreso ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simular Compra con Hotmart 🚀'}
              </button>
            </div>
          </div>
        ) : (
          /* PORTAL DEL ESTUDIANTE INTERACTIVO */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: CURSOS Y TEMARIO (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {!selectedCurso ? (
                // Vista: Seleccionar Curso
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#73827C]">Mis Cursos Disponibles</span>
                  {cursos.length === 0 ? (
                    <div className="p-8 text-center border border-[#26302C] rounded-2xl bg-[#141A18]/10 text-xs text-[#73827C]">
                      No hay cursos publicados todavía en esta academia.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cursos.map(c => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCurso(c)}
                          className="p-4 rounded-xl border border-[#26302C] bg-[#141A18]/20 hover:bg-[#141A18]/50 hover:border-emerald-500/20 cursor-pointer transition-all flex flex-col gap-2 group"
                        >
                          <h4 className="font-bold text-xs text-[#E7EDEA] group-hover:text-emerald-400 transition-colors">{c.titulo}</h4>
                          {c.descripcion && <p className="text-[10px] text-[#73827C] line-clamp-2 leading-relaxed">{c.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Vista: Temario del Curso Seleccionado
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCurso(null)}
                      className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                    >
                      ← Volver a Cursos
                    </button>
                    <span className="text-[9px] uppercase font-mono text-[#73827C]">Temario</span>
                  </div>

                  {/* Detalle del Curso Activo */}
                  <div className="p-4 rounded-2xl border border-[#26302C] bg-[#141A18]/30 space-y-3">
                    <h3 className="font-black text-xs text-[#E7EDEA]">{selectedCurso.titulo}</h3>
                    
                    {/* Barra de progreso global del curso */}
                    {pildoras.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[9px] font-mono text-[#73827C]">
                          <span>Progreso</span>
                          <span className="font-bold text-emerald-400">
                            {pildoras.filter(p => isPildoraCompletada(p.id)).length} de {pildoras.length} ({
                              Math.round((pildoras.filter(p => isPildoraCompletada(p.id)).length / pildoras.length) * 100)
                            }%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0b0f0e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3DD68C] rounded-full transition-all duration-500"
                            style={{
                              width: `${(pildoras.filter(p => isPildoraCompletada(p.id)).length / pildoras.length) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lista de Módulos y Clases */}
                  {loadingBloques ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-[#3DD68C]" />
                    </div>
                  ) : bloques.length === 0 ? (
                    <p className="text-xs text-[#73827C] text-center">Este curso no tiene contenidos estructurados por ahora.</p>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {bloques.map(b => {
                        const blockPills = pildoras.filter(p => p.bloque_id === b.id);
                        return (
                          <div key={b.id} className="border border-[#26302C] rounded-xl bg-[#0b0f0e]/20 overflow-hidden">
                            {/* Cabecera Módulo */}
                            <div className="p-3 bg-[#141A18]/40 border-b border-[#26302C]/30 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#E7EDEA] line-clamp-1">{b.titulo}</span>
                              <span className="text-[9px] font-mono text-[#73827C] px-1.5 py-0.5 rounded bg-[#0b0f0e]">{blockPills.length} clases</span>
                            </div>
                            
                            {/* Clases */}
                            <div className="p-2 space-y-1 bg-[#0b0f0e]/10">
                              {blockPills.length === 0 ? (
                                <p className="text-[9px] text-[#73827C] italic p-2">Sin clases publicadas.</p>
                              ) : (
                                blockPills.map(p => {
                                  const isSelected = selectedPildora?.id === p.id;
                                  const completed = isPildoraCompletada(p.id);
                                  return (
                                    <div
                                      key={p.id}
                                      onClick={() => setSelectedPildora(p)}
                                      className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between group/pill ${
                                        isSelected 
                                          ? 'bg-emerald-500/10 border border-emerald-500/20' 
                                          : 'hover:bg-[#141A18]/40 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 pr-2">
                                        <input
                                          type="checkbox"
                                          checked={completed}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggleProgreso(p.id, completed);
                                          }}
                                          disabled={submittingProgreso}
                                          className="w-3.5 h-3.5 rounded text-[#3DD68C] bg-[#0b0f0e] border-[#26302C] focus:ring-0 cursor-pointer disabled:opacity-50"
                                        />
                                        <span className={`text-[11px] font-medium line-clamp-1 transition-colors ${
                                          isSelected ? 'text-emerald-400 font-bold' : 'text-[#E7EDEA]'
                                        }`}>
                                          {p.titulo}
                                        </span>
                                      </div>
                                      
                                      <span className="text-[9px] text-[#73827C] font-mono whitespace-nowrap">
                                        {p.duracion_min || 0}m
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {/* TABLA DE CLASIFICACIÓN (LEADERBOARD) */}
              <div className="p-4 rounded-2xl border border-[#26302C] bg-[#141A18]/15 mt-4 space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-[#26302C]/40">
                  <Sparkles className="w-4 h-4 text-[#3DD68C] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E7EDEA]">Ranking de la Academia</span>
                </div>
                
                {loadingLeaderboard ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3DD68C]" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-[9px] text-[#73827C] italic text-center py-2">Sin actividad registrada aún.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {leaderboard.map((entry, idx) => {
                      const isTop3 = idx < 3;
                      const badgeColors = ['bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'bg-slate-400/10 text-slate-300 border-slate-400/20', 'bg-amber-700/10 text-amber-500 border-amber-700/20'];
                      return (
                        <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-[#26302C]/10 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded font-mono font-bold flex items-center justify-center border text-[8px] ${
                              isTop3 ? badgeColors[idx] : 'bg-[#0b0f0e] text-[#73827C] border-[#26302C]'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-[#E7EDEA] line-clamp-1">{entry.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-right font-mono">
                            <span className="text-[#73827C]">Nivel {entry.nivel}</span>
                            <span className="font-bold text-[#3DD68C]">{entry.puntos} pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: REPRODUCTOR Y CONTENIDO (8 cols) */}
            <div className="lg:col-span-8">
              {selectedPildora ? (
                <div className="p-6 rounded-3xl border border-[#26302C] bg-[#141A18]/30 space-y-6">
                  {/* Cabecera Lección */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-[#26302C]">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {selectedPildora.tipo === 'video' ? (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">🎥 Video</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">📝 Lectura</span>
                        )}
                        <span className="text-[9px] font-mono text-[#73827C]">{selectedPildora.duracion_min || 0} minutos de duración</span>
                      </div>
                      <h2 className="text-lg font-black text-[#E7EDEA] mt-1.5">{selectedPildora.titulo}</h2>
                    </div>

                    {/* Botón de marcar completada arriba a la derecha */}
                    <button
                      onClick={() => handleToggleProgreso(selectedPildora.id, isPildoraCompletada(selectedPildora.id))}
                      disabled={submittingProgreso}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer border ${
                        isPildoraCompletada(selectedPildora.id)
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          : 'bg-[#3DD68C] text-[#0B0F0E] border-transparent hover:opacity-90'
                      }`}
                    >
                      {submittingProgreso ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPildoraCompletada(selectedPildora.id) ? (
                        'Completada ✓'
                      ) : (
                        'Completar clase'
                      )}
                    </button>
                  </div>

                  {/* Contenedor del Reproductor/Contenido */}
                  <div className="space-y-4">
                    {selectedPildora.tipo === 'video' ? (
                      getEmbedUrl(selectedPildora.contenido) ? (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#26302C] bg-[#0b0f0e]/50">
                          <iframe
                            src={getEmbedUrl(selectedPildora.contenido)!}
                            title={selectedPildora.titulo}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="py-24 text-center rounded-2xl border border-dashed border-[#26302C] bg-[#0b0f0e]/30">
                          <p className="text-xs text-[#73827C]">No se configuró una URL de video válida para esta clase.</p>
                        </div>
                      )
                    ) : (
                      // Tipo Lectura/Texto
                      <div className="p-5 rounded-2xl border border-[#26302C] bg-[#0b0f0e]/20 text-xs text-[#73827C] leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap font-sans">
                        {selectedPildora.contenido || 'Esta clase de lectura no contiene texto por el momento.'}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Vista: Ninguna lección seleccionada
                <div className="flex flex-col items-center justify-center py-36 text-center gap-4 border border-dashed border-[#26302C] rounded-3xl bg-[#141A18]/5">
                  <div className="p-4 rounded-full bg-[#141A18]/30 border border-[#26302C] animate-float">
                    <BookOpen className="w-8 h-8 text-[#73827C]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#E7EDEA]">
                      {selectedCurso ? 'Comienza tu Lección' : 'Selecciona un Curso'}
                    </h3>
                    <p className="text-xs text-[#73827C] mt-1.5 max-w-[280px] leading-relaxed">
                      {selectedCurso
                        ? 'Elige una de las clases del temario de la izquierda para reproducir el video o leer el material de estudio.'
                        : 'Elige un curso en el panel izquierdo para desplegar su temario y empezar a estudiar.'}
                    </p>
                  </div>
                </div>
              )}
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
        
        {/* MODAL: CREAR/EDITAR CURSO */}
        {showCursoModal && (
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C] bg-[#141A18]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#3DD68C]" />
                  {editingCurso ? 'Editar Curso' : 'Nuevo Curso'}
                </h3>
                <button 
                  onClick={() => setShowCursoModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E7EDEA] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCursoSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Título del Curso</label>
                  <input
                    type="text"
                    required
                    value={cursoTitulo}
                    onChange={(e) => setCursoTitulo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Descripción</label>
                  <textarea
                    value={cursoDescripcion}
                    onChange={(e) => setCursoDescripcion(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Orden de Aparición</label>
                  <input
                    type="number"
                    min="0"
                    value={cursoOrden}
                    onChange={(e) => setCursoOrden(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="cursoPublicado"
                    checked={cursoPublicado}
                    onChange={(e) => setCursoPublicado(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3DD68C] bg-[#0b0f0e] border-[#26302C] focus:ring-0"
                  />
                  <label htmlFor="cursoPublicado" className="text-xs font-semibold text-[#E7EDEA] cursor-pointer">Publicar inmediatamente</label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#26302C]">
                  <button
                    type="button"
                    onClick={() => setShowCursoModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B0F0E]/40 text-[#E7EDEA] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCurso}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingCurso && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: CREAR/EDITAR BLOQUE (MÓDULO) */}
        {showBloqueModal && (
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C] bg-[#141A18]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#3DD68C]" />
                  {editingBloque ? 'Editar Módulo' : 'Nuevo Módulo'}
                </h3>
                <button 
                  onClick={() => setShowBloqueModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E7EDEA] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBloqueSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Título del Módulo</label>
                  <input
                    type="text"
                    required
                    value={bloqueTitulo}
                    onChange={(e) => setBloqueTitulo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Orden</label>
                  <input
                    type="number"
                    min="0"
                    value={bloqueOrden}
                    onChange={(e) => setBloqueOrden(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#26302C]">
                  <button
                    type="button"
                    onClick={() => setShowBloqueModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B0F0E]/40 text-[#E7EDEA] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBloque}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingBloque && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: CREAR/EDITAR PÍLDORA (LECCIÓN) */}
        {showPildoraModal && (
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C] bg-[#141A18]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#3DD68C]" />
                  {editingPildora ? 'Editar Lección' : 'Nueva Lección'}
                </h3>
                <button 
                  onClick={() => setShowPildoraModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E7EDEA] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handlePildoraSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Título de la Lección</label>
                  <input
                    type="text"
                    required
                    value={pildoraTitulo}
                    onChange={(e) => setPildoraTitulo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Tipo de Lección</label>
                  <select
                    value={pildoraTipo}
                    onChange={(e) => setPildoraTipo(e.target.value as 'video' | 'texto' | 'prueba')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#141A18] text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                  >
                    <option value="video">🎥 Video (URL)</option>
                    <option value="texto">📝 Texto (Markdown)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    {pildoraTipo === 'video' ? 'URL del Video (YouTube/Vimeo)' : 'Contenido Escrito (Markdown)'}
                  </label>
                  {pildoraTipo === 'video' ? (
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={pildoraContenido}
                      onChange={(e) => setPildoraContenido(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                    />
                  ) : (
                    <textarea
                      placeholder="Escribe el contenido aquí (soporta Markdown)..."
                      value={pildoraContenido}
                      onChange={(e) => setPildoraContenido(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all font-mono"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Duración (minutos)</label>
                    <input
                      type="number"
                      min="0"
                      value={pildoraDuracion}
                      onChange={(e) => setPildoraDuracion(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Orden</label>
                    <input
                      type="number"
                      min="0"
                      value={pildoraOrden}
                      onChange={(e) => setPildoraOrden(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0B0F0E]/50 text-[#E7EDEA] focus:ring-2 focus:ring-[#3DD68C]/15 focus:border-[#3DD68C] transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="pildoraPublicada"
                    checked={pildoraPublicada}
                    onChange={(e) => setPildoraPublicada(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3DD68C] bg-[#0b0f0e] border-[#26302C] focus:ring-0"
                  />
                  <label htmlFor="pildoraPublicada" className="text-xs font-semibold text-[#E7EDEA] cursor-pointer">Publicar lección</label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#26302C]">
                  <button
                    type="button"
                    onClick={() => setShowPildoraModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B0F0E]/40 text-[#E7EDEA] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPildora}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingPildora && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

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
