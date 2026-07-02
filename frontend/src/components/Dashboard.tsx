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
  Sparkles,
  DollarSign
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
  evaluarPildora,
  type Curso,
  type Bloque,
  type Pildora,
  type Progreso,
  type ResultadoEvaluacion
} from '../services/cursos';
import {
  getGamificacionPerfil,
  getLeaderboard,
  type GamificacionPerfil,
  type LeaderboardEntry
} from '../services/gamificacion';
import {
  getFinanzasMetricas,
  createCosto,
  deleteCosto,
  type FinanzasMetricas
} from '../services/finanzas';

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
  const [activeTabLocal, setActiveTabLocal] = useState<'resumen' | 'cursos' | 'ajustes' | 'finanzas'>('cursos');
  
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
  const [quizPreguntas, setQuizPreguntas] = useState<{ id: string; pregunta: string; opciones: string[]; respuesta_correcta: number }[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, number>>({});
  const [evaluationResult, setEvaluationResult] = useState<ResultadoEvaluacion | null>(null);
  const [evaluatingQuiz, setEvaluatingQuiz] = useState(false);

  useEffect(() => {
    setStudentAnswers({});
    setEvaluationResult(null);
  }, [selectedPildora]);

  // Estados de Gamificación
  const [perfilGamif, setPerfilGamif] = useState<GamificacionPerfil | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [isMembershipBlocked, setIsMembershipBlocked] = useState(false);

  // Estados de Finanzas
  const [finanzas, setFinanzas] = useState<FinanzasMetricas | null>(null);
  const [loadingFinanzas, setLoadingFinanzas] = useState(false);
  const [costoMonto, setCostoMonto] = useState('');
  const [costoDescripcion, setCostoDescripcion] = useState('');
  const [creatingCosto, setCreatingCosto] = useState(false);

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
  // Cargar Finanzas
  const loadFinanzasLocal = async () => {
    if (!user.academia_id) return;
    setLoadingFinanzas(true);
    try {
      const data = await getFinanzasMetricas(token, user.academia_id);
      setFinanzas(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar métricas financieras.');
    } finally {
      setLoadingFinanzas(false);
    }
  };

  const handleCostoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.academia_id) return;
    const montoNum = parseFloat(costoMonto);
    if (isNaN(montoNum) || montoNum <= 0 || !costoDescripcion.trim()) {
      toast.error('Gasto inválido.');
      return;
    }

    setCreatingCosto(true);
    try {
      await createCosto(token, user.academia_id, {
        monto: montoNum,
        descripcion: costoDescripcion.trim()
      });
      toast.success('Gasto registrado con éxito.');
      setCostoMonto('');
      setCostoDescripcion('');
      loadFinanzasLocal();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el gasto.');
    } finally {
      setCreatingCosto(false);
    }
  };

  const handleCostoDelete = async (costoId: string) => {
    if (!user.academia_id) return;
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    try {
      await deleteCosto(token, user.academia_id, costoId);
      toast.success('Gasto eliminado.');
      loadFinanzasLocal();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el gasto.');
    }
  };

  useEffect(() => {
    if (user.rol === 'admin_academia' && activeTabLocal === 'finanzas' && token) {
      loadFinanzasLocal();
    }
  }, [user.rol, activeTabLocal, token]);
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
      
      if (pildora.tipo === 'prueba' && pildora.contenido) {
        try {
          const parsed = JSON.parse(pildora.contenido);
          setQuizPreguntas(parsed.preguntas || []);
        } catch (err) {
          setQuizPreguntas([]);
        }
      } else {
        setQuizPreguntas([]);
      }
    } else {
      setPildoraTitulo('');
      setPildoraTipo('video');
      setPildoraContenido('');
      setPildoraDuracion(10);
      setPildoraOrden(pildoras.length);
      setPildoraPublicada(false);
      setQuizPreguntas([]);
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

    let contentToSubmit = pildoraContenido;
    if (pildoraTipo === 'prueba') {
      if (quizPreguntas.length === 0) {
        toast.error('Una evaluación debe tener al menos una pregunta.');
        return;
      }
      contentToSubmit = JSON.stringify({ preguntas: quizPreguntas });
    }

    setSubmittingPildora(true);
    try {
      if (editingPildora) {
        const updated = await updatePildora(token, user.academia_id, editingPildora.id, {
          titulo: pildoraTitulo,
          tipo: pildoraTipo,
          contenido: contentToSubmit,
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
          contenido: contentToSubmit,
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

  const handleEvaluarPrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.academia_id || !selectedPildora) return;

    let cuestionario: any = null;
    try {
      cuestionario = JSON.parse(selectedPildora.contenido || '{}');
    } catch (err) {
      toast.error('Error al cargar la prueba.');
      return;
    }

    const preguntas = cuestionario.preguntas || [];
    const unanswered = preguntas.some((q: any) => studentAnswers[q.id] === undefined);
    
    if (unanswered) {
      toast.error('Por favor, responde todas las preguntas del cuestionario.');
      return;
    }

    setEvaluatingQuiz(true);
    try {
      const res = await evaluarPildora(token, user.academia_id, selectedPildora.id, studentAnswers);
      setEvaluationResult(res);
      
      if (res.aprobado) {
        toast.success(`¡Excelente! Aprobaste la evaluación con ${res.nota}%.`);
        
        // Registrar progreso completado localmente
        setProgreso(prev => {
          const exists = prev.some(p => p.pildora_id === selectedPildora.id);
          const updatedProg = {
            pildora_id: selectedPildora.id,
            completada: true,
            completada_en: new Date().toISOString()
          };
          if (exists) {
            return prev.map(p => p.pildora_id === selectedPildora.id ? updatedProg : p);
          } else {
            return [...prev, updatedProg];
          }
        });

        // Recargar gamificación y clasificaciones
        loadGamificacionPerfil();
        loadLeaderboardLocal();
      } else {
        toast.error(`No has alcanzado la nota mínima aprobatoria (Obtuviste ${res.nota}%). Inténtalo de nuevo.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la evaluación.');
    } finally {
      setEvaluatingQuiz(false);
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
    <div className="w-full min-h-screen py-8 md:py-16 px-4 md:px-8 flex justify-center items-start bg-fondo overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-6xl p-6 md:p-10 rounded-3xl border glassmorphism relative overflow-hidden shadow-2xl border-linea"
      >
      {/* Orbes de luz decorativos flotantes de fondo */}
      <div 
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] transition-all duration-700 ease-out pointer-events-none animate-pulse-slow"
        style={{ 
          backgroundColor: selectedAcademia ? `${selectedAcademia.color_acento}1c` : 'var(--color-verde)1c',
        }} 
      />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none bg-blue-500/5" />

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* HEADER DE CONTROL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-linea)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--color-verde)' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest text-verde">
                {user.rol === 'super_admin' ? 'Administrador Global' : 'Panel de Control'}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1 text-texto">
              Motor Academias
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user.rol === 'estudiante' && perfilGamif && (
              <div className="flex items-center gap-3 mr-2 bg-verde/5 border border-verde/15 px-3.5 py-1.5 rounded-2xl">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-atenuado font-bold uppercase tracking-wider">Nivel {perfilGamif.nivel}</span>
                  <span className="text-xs font-black text-texto">{perfilGamif.puntos} PTS</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-verde/10 flex items-center justify-center text-verde">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            )}
            
            <div className="text-right">
              <p className="text-sm font-semibold text-texto">
                {user.rol === 'super_admin' ? 'Carlos' : user.rol === 'estudiante' ? 'Estudiante' : 'Usuario'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full mt-1 border bg-verde/5 border-verde/15 text-verde">
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
                  <h2 className="text-xl font-bold text-texto flex items-center gap-2">
                    <Globe className="w-5 h-5 text-verde" />
                    Academias
                  </h2>
                  <p className="text-xs text-atenuado">
                    Portales independientes instalados en el motor multi-inquilino
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateAcademiaModal(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-300 flex items-center gap-2 btn-primary"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Nueva Academia
                </motion.button>
              </div>

              {loadingAcademias ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-verde" />
                </div>
              ) : academias.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center rounded-2xl border border-dashed border-linea"
                >
                  <p className="text-sm text-atenuado">No hay academias creadas todavía. Crea una para comenzar.</p>
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
                          isSelected ? 'bg-superficie/80 border-verde/30' : 'bg-superficie/35 border-linea'
                        }`}
                        style={{
                          borderColor: isSelected ? academy.color_acento : undefined,
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
                            <h3 className="font-bold text-sm tracking-tight text-texto">
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
                          <p className="text-xs text-atenuado line-clamp-2 min-h-[32px]">
                            {academy.descripcion || 'Sin descripción disponible.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-linea/65 pt-3">
                          <span className="text-[11px] font-mono text-atenuado bg-fondo/40 px-2 py-0.5 rounded-md">
                            /{academy.slug}
                          </span>
                          
                          <span className="text-[10px] font-bold flex items-center gap-0.5 text-verde transition-transform group-hover:translate-x-0.5 duration-200">
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
            <div className="lg:col-span-5 flex flex-col gap-6 p-6 rounded-2xl border bg-superficie/20 border-linea">
              {selectedAcademia ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-linea">
                    <div>
                      <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                        <Users className="w-5 h-5 text-verde" />
                        Administradores
                      </h3>
                      <p className="text-xs text-atenuado">
                        Gestores de <strong className="text-texto">{selectedAcademia.nombre}</strong>
                      </p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowCreateAdminModal(true)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-texto border border-linea hover:bg-linea/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-verde" />
                      Agregar
                    </motion.button>
                  </div>

                  {loadingAdmins ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin text-verde" />
                    </div>
                  ) : admins.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-linea rounded-xl bg-fondo/10">
                      <p className="text-xs text-atenuado">No hay administradores asignados.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {admins.map((admin) => (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          key={admin.id} 
                          className="p-4 rounded-xl border border-linea bg-superficie/30 flex justify-between items-center text-xs"
                        >
                          <div className="space-y-1">
                            <h4 className="font-bold text-texto">{admin.nombre}</h4>
                            <p className="text-atenuado font-mono text-[10px]">{admin.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
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
                  <div className="p-4 rounded-full bg-superficie/50 border border-linea animate-float">
                    <Globe className="w-8 h-8 text-atenuado" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-texto">Selecciona una Academia</h3>
                    <p className="text-xs text-atenuado mt-1.5 max-w-[240px] leading-relaxed">
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
                className={`w-full p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3 text-sm font-bold ${
                  activeTabLocal === 'resumen'
                    ? 'bg-superficie text-texto shadow-[0_8px_20px_-10px_color-mix(in_srgb,var(--color-verde)_15%,transparent)]'
                    : 'bg-superficie/20 border-transparent text-atenuado hover:bg-superficie/50 hover:text-texto'
                }`}
                style={{ borderColor: activeTabLocal === 'resumen' ? 'var(--color-verde)' : undefined }}
              >
                <LayoutDashboard className="w-5 h-5" />
                Resumen
              </button>
              
              <button
                onClick={() => setActiveTabLocal('cursos')}
                className={`w-full p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3 text-sm font-bold ${
                  activeTabLocal === 'cursos'
                    ? 'bg-superficie text-texto shadow-[0_8px_20px_-10px_color-mix(in_srgb,var(--color-verde)_15%,transparent)]'
                    : 'bg-superficie/20 border-transparent text-atenuado hover:bg-superficie/50 hover:text-texto'
                }`}
                style={{ borderColor: activeTabLocal === 'cursos' ? 'var(--color-verde)' : undefined }}
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

              <button
                onClick={() => setActiveTabLocal('finanzas')}
                className={`w-full p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 text-sm font-bold ${
                  activeTabLocal === 'finanzas'
                    ? 'bg-[#141A18]/80 text-[#E7EDEA]'
                    : 'bg-[#141A18]/20 border-transparent text-[#73827C] hover:bg-[#141A18]/40 hover:text-[#E7EDEA]'
                }`}
                style={{ borderColor: activeTabLocal === 'finanzas' ? 'var(--color-verde)' : 'transparent' }}
              >
                <DollarSign className="w-5 h-5" />
                Finanzas
              </button>

              {/* Info de la Academia Activa */}
              {brand && (
                <div className="mt-6 p-4 rounded-2xl border border-[#26302C] bg-[#141A18]/20 text-center flex flex-col items-center gap-3">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.nombre} className="w-16 h-16 object-contain rounded-xl" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-verde/10 flex items-center justify-center text-verde font-black text-xl">
                      {brand.nombre[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-xs text-texto">{brand.nombre}</h4>
                    <p className="text-[10px] text-atenuado mt-1 font-mono">/{tenantSlug}</p>
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
                    <div className="p-6 rounded-2xl border border-linea bg-superficie/30">
                      <h4 className="text-xs font-bold text-atenuado uppercase tracking-wider mb-2">Cursos Activos</h4>
                      <p className="text-3xl font-black text-texto">{cursos.length}</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-linea bg-superficie/30">
                      <h4 className="text-xs font-bold text-atenuado uppercase tracking-wider mb-2">Total Módulos</h4>
                      <p className="text-3xl font-black text-texto">
                        {bloques.length || '-'}
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl border border-linea bg-superficie/30">
                      <h4 className="text-xs font-bold text-atenuado uppercase tracking-wider mb-2">Estudiantes Estimados</h4>
                      <p className="text-3xl font-black text-texto">3</p>
                    </div>
                  </div>

                  {/* Panel de Bienvenida */}
                  <div className="p-6 rounded-2xl border border-linea bg-superficie/30 space-y-4">
                    <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                      ¡Bienvenido al panel de tu academia!
                    </h3>
                    <p className="text-xs text-atenuado leading-relaxed">
                      Desde aquí puedes gestionar todo el contenido educativo que tus estudiantes verán al entrar.
                      Utiliza la pestaña de **Plan de Estudios** para subir tus videos y lecturas, u organiza los temas de tus módulos.
                    </p>
                  </div>
                </div>
              )}

              {activeTabLocal === 'ajustes' && (
                <div className="p-6 rounded-2xl border border-linea bg-superficie/30 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-texto">Personalizar Marca</h3>
                    <p className="text-xs text-atenuado mt-1">Configura los aspectos visuales e identitarios de tu academia.</p>
                  </div>

                  <form onSubmit={handleAjustesSubmit} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-atenuado">Nombre de la Academia</label>
                      <input
                        type="text"
                        required
                        value={ajustesNombre}
                        onChange={(e) => setAjustesNombre(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-linea outline-none text-sm bg-fondo/50 text-texto input-glow transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-atenuado">Descripción</label>
                      <textarea
                        value={ajustesDescripcion}
                        onChange={(e) => setAjustesDescripcion(e.target.value)}
                        rows={3}
                        placeholder="Describe de qué trata tu academia..."
                        className="w-full px-4 py-2.5 rounded-xl border border-linea outline-none text-sm bg-fondo/50 text-texto input-glow transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-atenuado">URL del Logotipo</label>
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/logo.png"
                        value={ajustesLogo}
                        onChange={(e) => setAjustesLogo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-linea outline-none text-sm bg-fondo/50 text-texto input-glow transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-atenuado">Color de Acento de la Interfaz</label>
                      <div className="flex items-center gap-3">
                        <input
                           type="color"
                          value={ajustesColor}
                          onChange={(e) => setAjustesColor(e.target.value)}
                          className="w-10 h-10 border-0 outline-none rounded-xl cursor-pointer p-0 bg-transparent"
                        />
                        <span className="font-mono text-xs text-atenuado uppercase">{ajustesColor}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAjustes}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 btn-primary disabled:opacity-50 cursor-pointer"
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
                      <h3 className="text-lg font-bold text-texto">Plan de Estudios</h3>
                      <p className="text-xs text-atenuado mt-0.5">Administra los cursos, módulos y clases de tu academia.</p>
                    </div>
                    <button
                      onClick={() => openCursoModal()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-verde text-fondo hover:opacity-90 transition-opacity flex items-center gap-1.5 btn-primary cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Curso
                    </button>
                  </div>

                  {loadingCursos ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-verde" />
                    </div>
                  ) : cursos.length === 0 ? (
                    <div className="p-16 text-center border border-dashed border-linea rounded-2xl">
                      <p className="text-sm text-atenuado">No hay cursos creados en esta academia. Haz clic en 'Nuevo Curso' para empezar.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Sub-columna 1: Lista de Cursos (5 cols) */}
                      <div className="md:col-span-5 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-atenuado">Listado de Cursos</span>
                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                          {cursos.map(c => {
                            const isSelected = selectedCurso?.id === c.id;
                            return (
                              <div
                                key={c.id}
                                onClick={() => setSelectedCurso(c)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${
                                  isSelected
                                    ? 'bg-superficie border-verde/30 shadow-[0_8px_20px_-10px_color-mix(in_srgb,var(--color-verde)_15%,transparent)]'
                                    : 'bg-superficie/10 border-linea hover:bg-superficie/35'
                                }`}
                              >
                                <div className="flex flex-col gap-1 pr-8">
                                  <h4 className="font-bold text-xs text-texto line-clamp-1">{c.titulo}</h4>
                                  <span className={`text-[9px] w-max px-1.5 py-0.5 rounded font-bold uppercase border ${
                                    c.publicado
                                      ? 'bg-verde/5 border-verde/10 text-verde'
                                      : 'bg-yellow-500/5 border-yellow-500/10 text-yellow-400'
                                  }`}>
                                    {c.publicado ? 'Publicado' : 'Borrador'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openCursoModal(c); }}
                                    className="p-1 rounded bg-linea text-atenuado hover:text-texto transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCursoDelete(c.id); }}
                                    className="p-1 rounded bg-linea text-atenuado hover:text-red-400 transition-colors cursor-pointer"
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
                          <div className="space-y-4 p-5 rounded-2xl border border-linea bg-superficie/20">
                            {/* Cabecera del Curso */}
                            <div className="flex justify-between items-start pb-3 border-b border-linea">
                              <div>
                                <h4 className="text-sm font-bold text-texto">{selectedCurso.titulo}</h4>
                                <p className="text-[11px] text-atenuado mt-1 line-clamp-2">{selectedCurso.descripcion || 'Sin descripción.'}</p>
                              </div>
                              <button
                                onClick={() => openBloqueModal()}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-verde/20 text-verde bg-verde/5 hover:bg-verde/10 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Módulo
                              </button>
                            </div>

                            {/* Lista de Módulos (Bloques) */}
                            {loadingBloques ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-verde" />
                              </div>
                            ) : bloques.length === 0 ? (
                               <p className="text-xs text-atenuado text-center py-6">Este curso aún no tiene módulos. Crea uno para agrupar tus lecciones.</p>
                            ) : (
                              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                                {bloques.map(b => {
                                  const isBloqueSelected = selectedBloque?.id === b.id;
                                  return (
                                    <div key={b.id} className="border border-linea rounded-xl bg-fondo/30 overflow-hidden">
                                      {/* Cabecera Módulo */}
                                      <div
                                        onClick={() => setSelectedBloque(isBloqueSelected ? null : b)}
                                        className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-superficie/40 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isBloqueSelected ? <ChevronDown className="w-4 h-4 text-verde" /> : <ChevronRight className="w-4 h-4 text-atenuado" />}
                                          <span className="text-xs font-bold text-texto">{b.titulo}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); openPildoraModal(); setSelectedBloque(b); }}
                                            className="px-2 py-0.5 rounded bg-verde/10 text-verde text-[9px] font-bold hover:bg-verde/20 border border-verde/10 flex items-center gap-0.5 cursor-pointer"
                                          >
                                            <Plus className="w-3 h-3" /> Clase
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); openBloqueModal(b); }}
                                            className="p-1 rounded bg-linea text-atenuado hover:text-texto transition-colors cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleBloqueDelete(b.id); }}
                                            className="p-1 rounded bg-linea text-atenuado hover:text-red-400 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Clases del Módulo (Píldoras) */}
                                      {isBloqueSelected && (
                                        <div className="border-t border-linea p-3 bg-fondo/10 space-y-2">
                                          {loadingPildoras ? (
                                            <div className="flex justify-center py-4">
                                              <Loader2 className="w-5 h-5 animate-spin text-verde" />
                                            </div>
                                          ) : pildoras.length === 0 ? (
                                            <p className="text-[10px] text-atenuado italic pl-6">Sin clases cargadas todavía.</p>
                                          ) : (
                                            pildoras.map(p => (
                                              <div key={p.id} className="pl-6 py-2 pr-2 border-b border-linea/40 last:border-b-0 flex justify-between items-center group/pildora">
                                                <div className="flex items-center gap-2">
                                                  {p.tipo === 'video' ? <Video className="w-3.5 h-3.5 text-verde" /> : <FileText className="w-3.5 h-3.5 text-blue-400" />}
                                                  <div className="flex flex-col">
                                                    <span className="text-xs text-texto font-semibold">{p.titulo}</span>
                                                    <span className="text-[9px] text-atenuado mt-0.5">{p.duracion_min || 0} min | {p.publicada ? 'Pública' : 'Borrador'}</span>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/pildora:opacity-100 transition-opacity">
                                                  <button
                                                    onClick={() => openPildoraModal(p)}
                                                    className="p-1 rounded bg-linea text-atenuado hover:text-texto transition-colors cursor-pointer"
                                                  >
                                                    <Edit3 className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handlePildoraDelete(p.id)}
                                                    className="p-1 rounded bg-linea text-atenuado hover:text-red-400 transition-colors cursor-pointer"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
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
                          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed border-linea rounded-2xl bg-superficie/10">
                            <BookOpen className="w-8 h-8 text-atenuado animate-float" />
                            <div>
                      <h4 className="text-xs font-bold text-texto">Estructura de Contenidos</h4>
                              <p className="text-[10px] text-atenuado mt-1 max-w-[200px]">Selecciona un curso a la izquierda para administrar sus módulos y lecciones.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTabLocal === 'finanzas' && (
                <div className="space-y-6">
                  {/* Vista Finanzas */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-texto">Dashboard Financiero</h3>
                      <p className="text-xs text-atenuado mt-0.5">Control de ingresos por Hotmart, registro de costos y ganancia neta.</p>
                    </div>
                  </div>

                  {loadingFinanzas ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-verde" />
                    </div>
                  ) : !finanzas ? (
                    <p className="text-xs text-atenuado">Error al cargar datos financieros.</p>
                  ) : (
                    <div className="space-y-8">
                      {/* Tarjetas métricas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl border border-linea/60 bg-superficie/30 glassmorphism-hover transition-all duration-300">
                          <h4 className="text-xs font-bold text-atenuado uppercase tracking-wider mb-2">Ingresos Totales</h4>
                          <p className="text-2xl font-black text-verde">+${finanzas.ingresos_totales.toFixed(2)} USD</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-linea/60 bg-superficie/30 glassmorphism-hover transition-all duration-300">
                          <h4 className="text-xs font-bold text-atenuado uppercase tracking-wider mb-2">Costos Totales</h4>
                          <p className="text-2xl font-black text-red-400">-${finanzas.costos_totales.toFixed(2)} USD</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-linea/60 bg-superficie/30 glassmorphism-hover transition-all duration-300">
                          <h4 className="text-xs font-bold text-atenuado uppercase tracking-wider mb-2">Ganancia Neta</h4>
                          <p className={`text-2xl font-black ${finanzas.beneficio_neto >= 0 ? 'text-verde' : 'text-red-400'}`}>
                            {finanzas.beneficio_neto >= 0 ? '+' : ''}${finanzas.beneficio_neto.toFixed(2)} USD
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Registrar Gasto (5 cols) */}
                        <div className="lg:col-span-5 p-5 rounded-2xl border border-linea/60 bg-superficie/30 glassmorphism space-y-4">
                          <h4 className="text-xs font-bold text-texto uppercase tracking-wider">Registrar Gasto Operativo</h4>
                          
                          <form onSubmit={handleCostoSubmit} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-atenuado">Descripción</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Servidores, publicidad..."
                                value={costoDescripcion}
                                onChange={(e) => setCostoDescripcion(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-linea outline-none text-sm bg-fondo/50 text-texto input-glow transition-all duration-200"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-atenuado">Monto (USD)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                placeholder="0.00"
                                value={costoMonto}
                                onChange={(e) => setCostoMonto(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-linea outline-none text-sm bg-fondo/50 text-texto input-glow transition-all duration-200"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={creatingCosto}
                              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer btn-primary disabled:opacity-50"
                            >
                              {creatingCosto && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Registrar Costo
                            </button>
                          </form>
                        </div>

                        {/* Listado de transacciones (7 cols) */}
                        <div className="lg:col-span-7 p-5 rounded-2xl border border-linea/60 bg-superficie/30 glassmorphism space-y-4">
                          <h4 className="text-xs font-bold text-texto uppercase tracking-wider">Historial de Transacciones</h4>
                          
                          {finanzas.transacciones.length === 0 ? (
                            <p className="text-xs text-atenuado italic">Sin transacciones registradas.</p>
                          ) : (
                            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                              {finanzas.transacciones.map((t) => (
                                <div key={t.id} className="flex justify-between items-center p-3 rounded-xl border border-linea/45 bg-fondo/35 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                                        t.tipo === 'venta' 
                                          ? 'bg-verde/10 text-verde border border-verde/10' 
                                          : 'bg-red-500/10 text-red-400 border border-red-500/10'
                                      }`}>
                                        {t.tipo}
                                      </span>
                                      <span className="font-bold text-texto">{t.detalle}</span>
                                    </div>
                                    <span className="text-[9px] text-atenuado block font-mono">
                                      {new Date(t.fecha).toLocaleDateString()} {new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className={`font-mono font-black ${t.tipo === 'venta' ? 'text-verde' : 'text-red-400'}`}>
                                      {t.tipo === 'venta' ? '+' : '-'}${t.monto.toFixed(2)}
                                    </span>
                                    {t.tipo === 'costo' && (
                                      <button
                                        onClick={() => handleCostoDelete(t.id)}
                                        className="p-1 rounded bg-linea text-atenuado hover:text-red-400 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : isMembershipBlocked ? (
          /* PANTALLA DE PAYWALL PREMIUM */
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto gap-6 border border-linea bg-superficie/20 rounded-3xl p-8 relative overflow-hidden w-full">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-10 pointer-events-none"
              style={{ backgroundColor: 'var(--color-verde)' }}
            />
            
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-float">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="text-xl font-black text-texto">Acceso Premium Requerido</h2>
              <p className="text-xs text-atenuado leading-relaxed">
                No tienes una membresía activa en <span className="font-bold text-texto">{brand?.nombre || 'esta academia'}</span>.
                Adquiere tu plan para desbloquear todos los cursos, lecciones interactivas y ver tu posición en el ranking de estudiantes.
              </p>
            </div>

            {/* Simulación del Webhook de Hotmart */}
            <div className="w-full p-4 rounded-2xl border border-linea bg-fondo/50 text-left space-y-3 relative z-10">
              <span className="text-[9px] uppercase font-mono text-atenuado font-bold">Simulador de Pago (Entorno de Pruebas)</span>
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-atenuado">CORREO A ENVIAR AL WEBHOOK</label>
                <input
                  type="text"
                  readOnly
                  value={user.email}
                  className="w-full px-3.5 py-2 rounded-lg border border-linea outline-none text-xs bg-superficie/50 text-atenuado"
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
                className="w-full py-2.5 rounded-xl text-xs font-black bg-verde text-fondo hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer btn-primary"
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-atenuado">Mis Cursos Disponibles</span>
                  {cursos.length === 0 ? (
                    <div className="p-8 text-center border border-linea rounded-2xl bg-superficie/10 text-xs text-atenuado">
                      No hay cursos publicados todavía en esta academia.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cursos.map(c => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCurso(c)}
                          className="p-4 rounded-xl border border-linea bg-superficie/20 hover:bg-superficie/50 hover:border-verde/20 cursor-pointer transition-all flex flex-col gap-2 group"
                        >
                          <h4 className="font-bold text-xs text-texto group-hover:text-verde transition-colors">{c.titulo}</h4>
                          {c.descripcion && <p className="text-[10px] text-atenuado line-clamp-2 leading-relaxed">{c.descripcion}</p>}
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
                      className="text-[10px] font-bold text-verde hover:underline cursor-pointer"
                    >
                      ← Volver a Cursos
                    </button>
                    <span className="text-[9px] uppercase font-mono text-atenuado">Temario</span>
                  </div>

                  {/* Detalle del Curso Activo */}
                  <div className="p-4 rounded-2xl border border-linea bg-superficie/35 space-y-3">
                    <h3 className="font-black text-xs text-texto">{selectedCurso.titulo}</h3>
                    
                    {/* Barra de progreso global del curso */}
                    {pildoras.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[9px] font-mono text-atenuado">
                          <span>Progreso</span>
                          <span className="font-bold text-verde">
                            {pildoras.filter(p => isPildoraCompletada(p.id)).length} de {pildoras.length} ({
                              Math.round((pildoras.filter(p => isPildoraCompletada(p.id)).length / pildoras.length) * 100)
                            }%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-fondo rounded-full overflow-hidden">
                          <div
                            className="h-full bg-verde rounded-full transition-all duration-500"
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
                      <Loader2 className="w-6 h-6 animate-spin text-verde" />
                    </div>
                  ) : bloques.length === 0 ? (
                    <p className="text-xs text-atenuado text-center">Este curso no tiene contenidos estructurados por ahora.</p>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {bloques.map(b => {
                        const blockPills = pildoras.filter(p => p.bloque_id === b.id);
                        return (
                          <div key={b.id} className="border border-linea rounded-xl bg-fondo/20 overflow-hidden">
                            {/* Cabecera Módulo */}
                            <div className="p-3 bg-superficie/40 border-b border-linea/30 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-texto line-clamp-1">{b.titulo}</span>
                              <span className="text-[9px] font-mono text-atenuado px-1.5 py-0.5 rounded bg-fondo">{blockPills.length} clases</span>
                            </div>
                            
                            {/* Clases */}
                            <div className="p-2 space-y-1 bg-fondo/10">
                              {blockPills.length === 0 ? (
                                <p className="text-[9px] text-atenuado italic p-2">Sin clases publicadas.</p>
                              ) : (
                                blockPills.map(p => {
                                  const isSelected = selectedPildora?.id === p.id;
                                  const completed = isPildoraCompletada(p.id);
                                  return (
                                    <div
                                      key={p.id}
                                      onClick={() => setSelectedPildora(p)}
                                      className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between group/pill border ${
                                        isSelected 
                                          ? 'bg-verde/10 border-verde/20' 
                                          : 'hover:bg-superficie/40 border-transparent'
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
                                          className="w-3.5 h-3.5 rounded text-verde bg-fondo border-linea focus:ring-0 cursor-pointer disabled:opacity-50"
                                        />
                                        <span className={`text-[11px] font-medium line-clamp-1 transition-colors ${
                                          isSelected ? 'text-verde font-bold' : 'text-texto'
                                        }`}>
                                          {p.titulo}
                                        </span>
                                      </div>
                                      
                                      <span className="text-[9px] text-atenuado font-mono whitespace-nowrap">
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
              <div className="p-4 rounded-2xl border border-linea bg-superficie/15 mt-4 space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-linea/40">
                  <Sparkles className="w-4 h-4 text-verde animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-texto">Ranking de la Academia</span>
                </div>
                
                {loadingLeaderboard ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-verde" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-[9px] text-atenuado italic text-center py-2">Sin actividad registrada aún.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {leaderboard.map((entry, idx) => {
                      const isTop3 = idx < 3;
                      const badgeColors = ['bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'bg-slate-400/10 text-slate-300 border-slate-400/20', 'bg-amber-700/10 text-amber-500 border-amber-700/20'];
                      return (
                        <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-linea/10 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded font-mono font-bold flex items-center justify-center border text-[8px] ${
                              isTop3 ? badgeColors[idx] : 'bg-fondo text-atenuado border-linea'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-texto line-clamp-1">{entry.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-right font-mono">
                            <span className="text-atenuado">Nivel {entry.nivel}</span>
                            <span className="font-bold text-verde">{entry.puntos} pts</span>
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
                <div className="p-6 rounded-3xl border border-linea/60 bg-superficie/30 glassmorphism space-y-6">
                  {/* Cabecera Lección */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-linea">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {selectedPildora.tipo === 'video' ? (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-verde/10 text-verde border border-verde/10">🎥 Video</span>
                        ) : selectedPildora.tipo === 'texto' ? (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">📝 Lectura</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-purple-500/10 text-purple-400 border border-purple-500/10">📝 Evaluación</span>
                        )}
                        <span className="text-[9px] font-mono text-atenuado">{selectedPildora.duracion_min || 0} minutos de duración</span>
                      </div>
                      <h2 className="text-lg font-black text-texto mt-1.5">{selectedPildora.titulo}</h2>
                    </div>

                    {/* Botón de marcar completada arriba a la derecha */}
                    {selectedPildora.tipo !== 'prueba' && (
                      <button
                        onClick={() => handleToggleProgreso(selectedPildora.id, isPildoraCompletada(selectedPildora.id))}
                        disabled={submittingProgreso}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer border ${
                          isPildoraCompletada(selectedPildora.id)
                            ? 'bg-verde/5 border-verde/30 text-verde hover:bg-verde/10'
                            : 'btn-primary'
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
                    )}
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
                    ) : selectedPildora.tipo === 'texto' ? (
                      // Tipo Lectura/Texto
                      <div className="p-5 rounded-2xl border border-[#26302C] bg-[#0b0f0e]/20 text-xs text-[#73827C] leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap font-sans">
                        {selectedPildora.contenido || 'Esta clase de lectura no contiene texto por el momento.'}
                      </div>
                    ) : (
                      // Tipo Evaluación/Prueba
                      <QuizStudentViewer 
                        pildora={selectedPildora}
                        answers={studentAnswers}
                        onSelectAnswer={(qId, optIdx) => setStudentAnswers(prev => ({ ...prev, [qId]: optIdx }))}
                        onSubmit={handleEvaluarPrueba}
                        submitting={evaluatingQuiz}
                        result={evaluationResult}
                        onReset={() => {
                          setStudentAnswers({});
                          setEvaluationResult(null);
                        }}
                      />
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
                    <h3 className="text-sm font-bold text-[#E6ECE9]">
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
        <div className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 flex gap-4 items-start glassmorphism relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-10 bg-sky-500 pointer-events-none" />
          <div className="p-2.5 rounded-xl bg-sky-500/10 flex-shrink-0 text-sky-400">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1 relative z-10">
            <h4 className="text-sm font-bold text-sky-400">
              Estado de la Plataforma
            </h4>
            <p className="text-xs text-[#E6ECE9] leading-relaxed">
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C]/60 glassmorphism relative overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E6ECE9] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#3DD68C]" />
                  {editingCurso ? 'Editar Curso' : 'Nuevo Curso'}
                </h3>
                <button 
                  onClick={() => setShowCursoModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E6ECE9] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Descripción</label>
                  <textarea
                    value={cursoDescripcion}
                    onChange={(e) => setCursoDescripcion(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Orden de Aparición</label>
                  <input
                    type="number"
                    min="0"
                    value={cursoOrden}
                    onChange={(e) => setCursoOrden(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                  <label htmlFor="cursoPublicado" className="text-xs font-semibold text-[#E6ECE9] cursor-pointer">Publicar inmediatamente</label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#26302C]">
                  <button
                    type="button"
                    onClick={() => setShowCursoModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B0F0E]/40 text-[#E6ECE9] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCurso}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer btn-primary transition-all duration-300 flex items-center gap-1.5"
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C]/60 glassmorphism relative overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E6ECE9] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#3DD68C]" />
                  {editingBloque ? 'Editar Módulo' : 'Nuevo Módulo'}
                </h3>
                <button 
                  onClick={() => setShowBloqueModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E6ECE9] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Orden</label>
                  <input
                    type="number"
                    min="0"
                    value={bloqueOrden}
                    onChange={(e) => setBloqueOrden(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#26302C]">
                  <button
                    type="button"
                    onClick={() => setShowBloqueModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B0F0E]/40 text-[#E6ECE9] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBloque}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer btn-primary transition-all duration-300 flex items-center gap-1.5"
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C]/60 glassmorphism relative overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <h3 className="text-lg font-bold text-[#E6ECE9] flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#3DD68C]" />
                  {editingPildora ? 'Editar Lección' : 'Nueva Lección'}
                </h3>
                <button 
                  onClick={() => setShowPildoraModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E6ECE9] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Tipo de Lección</label>
                  <select
                    value={pildoraTipo}
                    onChange={(e) => setPildoraTipo(e.target.value as 'video' | 'texto' | 'prueba')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#0D1210] text-[#E6ECE9] input-glow transition-all"
                  >
                    <option value="video">🎥 Video (URL)</option>
                    <option value="texto">📝 Texto (Markdown)</option>
                    <option value="prueba">📝 Cuestionario (Prueba)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">
                    {pildoraTipo === 'video' 
                      ? 'URL del Video (YouTube/Vimeo)' 
                      : pildoraTipo === 'texto' 
                      ? 'Contenido Escrito (Markdown)' 
                      : 'Preguntas del Cuestionario'}
                  </label>
                  {pildoraTipo === 'video' ? (
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={pildoraContenido}
                      onChange={(e) => setPildoraContenido(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                    />
                  ) : pildoraTipo === 'texto' ? (
                    <textarea
                      placeholder="Escribe el contenido aquí (soporta Markdown)..."
                      value={pildoraContenido}
                      onChange={(e) => setPildoraContenido(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200 font-mono"
                    />
                  ) : (
                    /* Creador de cuestionario interactivo */
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {quizPreguntas.map((q, qIndex) => (
                        <div key={q.id} className="p-3 rounded-xl border border-[#26302C] bg-[#0d1210]/50 space-y-3 relative group">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizPreguntas(prev => prev.filter(item => item.id !== q.id));
                            }}
                            className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                          >
                            Eliminar
                          </button>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-verde uppercase">Pregunta {qIndex + 1}</span>
                            <input
                              type="text"
                              required
                              placeholder="Escribe la pregunta..."
                              value={q.pregunta}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQuizPreguntas(prev => prev.map(item => item.id === q.id ? { ...item, pregunta: val } : item));
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#26302C] outline-none text-xs bg-[#060908]/30 text-[#E6ECE9] focus:border-verde"
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-[#73827C] uppercase">Opciones (Marca la correcta)</span>
                            {q.opciones.map((opt, optIndex) => (
                              <div key={optIndex} className="flex gap-2 items-center">
                                <input
                                  type="radio"
                                  name={`correcta_${q.id}`}
                                  checked={q.respuesta_correcta === optIndex}
                                  onChange={() => {
                                    setQuizPreguntas(prev => prev.map(item => item.id === q.id ? { ...item, respuesta_correcta: optIndex } : item));
                                  }}
                                  className="w-3.5 h-3.5 text-verde bg-fondo border-linea focus:ring-0 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  required
                                  placeholder={`Opción ${optIndex + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuizPreguntas(prev => prev.map(item => {
                                      if (item.id === q.id) {
                                        const newOpts = [...item.opciones];
                                        newOpts[optIndex] = val;
                                        return { ...item, opciones: newOpts };
                                      }
                                      return item;
                                    }));
                                  }}
                                  className="flex-grow px-3 py-1 rounded-lg border border-[#26302C] outline-none text-xs bg-[#060908]/20 text-[#E6ECE9] focus:border-verde"
                                />
                                {q.opciones.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuizPreguntas(prev => prev.map(item => {
                                        if (item.id === q.id) {
                                          const newOpts = item.opciones.filter((_, idx) => idx !== optIndex);
                                          const newCorrect = item.respuesta_correcta >= newOpts.length ? 0 : item.respuesta_correcta;
                                          return { ...item, opciones: newOpts, respuesta_correcta: newCorrect };
                                        }
                                        return item;
                                      }));
                                    }}
                                    className="text-xs text-red-500 hover:text-red-400 font-bold"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            {q.opciones.length < 5 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizPreguntas(prev => prev.map(item => {
                                    if (item.id === q.id) {
                                      return { ...item, opciones: [...item.opciones, ''] };
                                    }
                                    return item;
                                  }));
                                }}
                                className="text-[10px] text-verde font-bold hover:underline cursor-pointer"
                              >
                                + Añadir Opción
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = {
                            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            pregunta: '',
                            opciones: ['', ''],
                            respuesta_correcta: 0
                          };
                          setQuizPreguntas(prev => [...prev, newQ]);
                        }}
                        className="w-full py-2 border border-dashed border-[#26302C] rounded-xl text-xs font-bold text-verde bg-verde/5 hover:bg-verde/10 transition-colors cursor-pointer"
                      >
                        + Nueva Pregunta
                      </button>
                    </div>
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
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#73827C]">Orden</label>
                    <input
                      type="number"
                      min="0"
                      value={pildoraOrden}
                      onChange={(e) => setPildoraOrden(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                  <label htmlFor="pildoraPublicada" className="text-xs font-semibold text-[#E6ECE9] cursor-pointer">Publicar lección</label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#26302C]">
                  <button
                    type="button"
                    onClick={() => setShowPildoraModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B0F0E]/40 text-[#E6ECE9] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPildora}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer btn-primary transition-all duration-300 flex items-center gap-1.5"
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C]/60 glassmorphism relative overflow-hidden shadow-2xl"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                      <span className="text-[10px] font-mono text-[#E6ECE9]">{colorAcento}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[#26302C] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAcademiaModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#0B0F0E]/40 text-[#E6ECE9] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAcademia}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer btn-primary disabled:opacity-50 transition-all duration-300 flex items-center gap-1.5"
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
              className="w-full max-w-md p-6 rounded-3xl border border-[#26302C]/60 glassmorphism relative overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#26302C]">
                <div>
                  <h3 className="text-lg font-bold text-[#E6ECE9] flex items-center gap-2">
                    <Plus className="w-5 h-5" style={{ color: selectedAcademia.color_acento }} />
                    Nuevo Administrador
                  </h3>
                  <p className="text-[11px] text-[#73827C] mt-0.5">
                    Asignar a la academia: <strong style={{ color: selectedAcademia.color_acento }}>{selectedAcademia.nombre}</strong>
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowCreateAdminModal(false)}
                  className="p-1 rounded-lg text-[#73827C] hover:text-[#E6ECE9] hover:bg-[#26302C]/30 transition-colors cursor-pointer"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26302C] outline-none text-sm bg-[#060908]/50 text-[#E6ECE9] input-glow transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[#26302C] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAdminModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#0B0F0E]/40 text-[#E6ECE9] border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAdmin}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer btn-primary disabled:opacity-50 transition-all duration-300 flex items-center gap-1.5"
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
    </div>
  );
}

interface QuizStudentViewerProps {
  pildora: Pildora;
  answers: Record<string, number>;
  onSelectAnswer: (qId: string, optIdx: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  result: ResultadoEvaluacion | null;
  onReset: () => void;
}

function QuizStudentViewer({
  pildora,
  answers,
  onSelectAnswer,
  onSubmit,
  submitting,
  result,
  onReset
}: QuizStudentViewerProps) {
  let cuestionario: any = null;
  try {
    cuestionario = JSON.parse(pildora.contenido || '{}');
  } catch (err) {
    return (
      <div className="p-6 text-center border border-dashed border-red-500/25 rounded-2xl bg-red-500/5 text-xs text-red-400 font-medium">
        Error al decodificar el cuestionario en el cliente.
      </div>
    );
  }

  const preguntas = cuestionario.preguntas || [];

  if (preguntas.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-[#26302C] rounded-2xl bg-[#0b0f0e]/10 text-xs text-[#73827C] italic">
        Esta evaluación no tiene preguntas cargadas.
      </div>
    );
  }

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl border border-[#26302C] bg-[#0d1210]/35 space-y-6 text-center relative overflow-hidden"
      >
        {result.aprobado && (
          <div className="absolute inset-0 pointer-events-none bg-verde/5 flex items-center justify-center">
            {/* Orbe decorativo */}
            <div className="w-48 h-48 rounded-full blur-[80px] bg-verde/20 animate-pulse" />
          </div>
        )}
        
        <div className="relative z-10 space-y-4 animate-float-slow">
          <div className="inline-flex p-4 rounded-full bg-[#060908] border border-[#26302C]">
            {result.aprobado ? (
              <Sparkles className="w-8 h-8 text-verde" />
            ) : (
              <Lock className="w-8 h-8 text-red-400" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-texto">
              {result.aprobado ? '¡Evaluación Aprobada!' : 'Evaluación Reprobada'}
            </h3>
            <p className="text-xs text-atenuado max-w-xs mx-auto">
              {result.aprobado 
                ? `¡Felicitaciones! Has completado con éxito esta lección interactiva.` 
                : `No has alcanzado la nota mínima requerida (70%). Revisa el temario e inténtalo de nuevo.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto py-2">
            <div className="p-3.5 rounded-xl border border-[#26302C] bg-[#060908]/60">
              <span className="block text-[9px] font-bold text-atenuado uppercase">Calificación</span>
              <span className={`text-base font-black ${result.aprobado ? 'text-verde' : 'text-red-400'}`}>
                {result.nota}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-[#26302C] bg-[#060908]/60">
              <span className="block text-[9px] font-bold text-atenuado uppercase">Puntos</span>
              <span className="text-base font-black text-[#E6ECE9]">
                +{result.puntos_ganados} PTS
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {!result.aprobado && (
              <button
                type="button"
                onClick={onReset}
                className="w-full py-2.5 rounded-xl text-xs font-bold btn-primary cursor-pointer max-w-xs mx-auto block"
              >
                Reintentar Evaluación
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
        {preguntas.map((q: any, qIndex: number) => (
          <div key={q.id} className="p-4 rounded-xl border border-[#26302C] bg-[#0d1210]/20 space-y-3">
            <div className="flex gap-2 items-start">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#26302C] text-[#73827C]">
                Q{qIndex + 1}
              </span>
              <h4 className="text-xs font-bold text-texto leading-relaxed pt-0.5">
                {q.pregunta}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pl-6 pt-1">
              {q.opciones.map((opt: string, optIndex: number) => {
                const isSelected = answers[q.id] === optIndex;
                return (
                  <div
                    key={optIndex}
                    onClick={() => onSelectAnswer(q.id, optIndex)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-verde/5 border-verde/30 text-verde' 
                        : 'bg-fondo/45 border-linea/65 hover:bg-superficie/40 hover:text-texto text-atenuado'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-verde bg-verde/15' : 'border-atenuado/40'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-verde" />}
                    </div>
                    <span className="font-semibold">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-linea flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl text-xs font-black btn-primary flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Finalizar y Enviar
        </button>
      </div>
    </form>
  );
}

