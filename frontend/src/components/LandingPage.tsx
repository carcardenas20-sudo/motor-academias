import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getAcademiaPublicInfo, 
  getPublicCoursesOutline, 
  type AcademiaPublicInfo, 
  type PublicCurso 
} from '../services/academias';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Play, 
  Loader2, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [brand, setBrand] = useState<AcademiaPublicInfo | null>(null);
  const [courses, setCourses] = useState<PublicCurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<PublicCurso | null>(null);
  const [expandedBloque, setExpandedBloque] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug) return;

    async function loadPublicData() {
      try {
        const brandData = await getAcademiaPublicInfo(tenantSlug!);
        setBrand(brandData);
        document.documentElement.style.setProperty('--color-verde', brandData.color_acento);

        const outlineData = await getPublicCoursesOutline(tenantSlug!);
        setCourses(outlineData);
        if (outlineData.length > 0) {
          setSelectedCurso(outlineData[0]);
        }
      } catch (err: any) {
        setError(err.message || 'La academia no está disponible.');
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-fondo text-texto flex flex-col items-center justify-center p-4 w-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-verde" />
          <p className="text-xs text-atenuado font-bold tracking-widest uppercase">Cargando Academia...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-fondo text-texto flex flex-col items-center justify-center p-6 w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 animate-float">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Error de Conexión</h2>
        <p className="text-xs text-atenuado max-w-sm mb-6 leading-relaxed">
          {error || 'No pudimos encontrar la academia solicitada. Revisa el enlace o intenta de nuevo.'}
        </p>
        <Link 
          to="/login"
          className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo text-texto flex flex-col font-sans w-full selection:bg-verde/20 selection:text-verde">
      
      {/* Luces decorativas */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full blur-[140px] opacity-[0.08] pointer-events-none animate-pulse-slow" 
        style={{ backgroundColor: brand.color_acento }} 
      />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full blur-[140px] opacity-[0.04] pointer-events-none bg-blue-500/40" />

      {/* HEADER */}
      <header className="relative z-10 w-full border-b border-linea/40 bg-fondo/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.nombre} className="h-8 object-contain" />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-fondo font-black text-sm uppercase"
                style={{ backgroundColor: brand.color_acento }}
              >
                {brand.nombre.charAt(0)}
              </div>
            )}
            <span className="font-black text-sm tracking-tight text-texto">{brand.nombre}</span>
          </div>

          <Link 
            to={`/${tenantSlug}/login`}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-linea text-texto hover:bg-linea/40 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 flex-grow max-w-6xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col gap-16">
        
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <span 
            className="text-[10px] font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full border border-verde/15 bg-verde/5 text-verde"
          >
            Academia Oficial
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-gradient">
            Aprende en <span className="accent-gradient" style={{ backgroundImage: `linear-gradient(135deg, ${brand.color_acento} 0%, #27AD70 100%)` }}>{brand.nombre}</span>
          </h1>
          <p className="text-xs md:text-sm text-atenuado leading-relaxed max-w-xl">
            {brand.descripcion || 'Bienvenido a nuestra aula virtual. Explora nuestro catálogo de cursos diseñados para llevar tus habilidades al siguiente nivel.'}
          </p>
          
          <div className="flex items-center gap-4 mt-6">
            <Link 
              to={`/${tenantSlug}/login`}
              className="px-6 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 btn-primary"
            >
              Comenzar a aprender
            </Link>
          </div>
        </div>

        {/* CATALOGO DE CURSOS */}
        <div className="space-y-8">
          <div className="border-b border-linea/40 pb-4">
            <h2 className="text-xl font-black text-texto flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: brand.color_acento }} />
              Plan de Estudios y Cursos
            </h2>
            <p className="text-xs text-atenuado mt-1">Navega a través de los módulos y lecciones disponibles en la academia.</p>
          </div>

          {courses.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-linea rounded-2xl bg-superficie/10 text-xs text-atenuado">
              No hay cursos publicados actualmente. Vuelve más tarde.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Selector lateral de cursos (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-atenuado mb-1">Cursos del catálogo</span>
                {courses.map(c => {
                  const isSelected = selectedCurso?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedCurso(c); setExpandedBloque(null); }}
                      style={{ borderColor: isSelected ? brand.color_acento : undefined }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                        isSelected 
                          ? 'bg-verde/5 border-verde/20 shadow-[0_8px_20px_-10px_color-mix(in_srgb,var(--color-verde)_15%,transparent)]' 
                          : 'bg-superficie/20 border-linea/60 glassmorphism-hover'
                      }`}
                    >
                      <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-verde' : 'text-texto'}`}>{c.titulo}</h4>
                      {c.descripcion && <p className="text-[10px] text-atenuado line-clamp-2 leading-relaxed">{c.descripcion}</p>}
                    </div>
                  );
                })}
              </div>

              {/* Temario del curso activo (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {selectedCurso && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl border border-linea/60 bg-superficie/30 glassmorphism">
                      <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-atenuado">Curso Seleccionado</span>
                      <h3 className="text-base font-black text-texto mt-1.5">{selectedCurso.titulo}</h3>
                      {selectedCurso.descripcion && (
                        <p className="text-xs text-atenuado mt-2.5 leading-relaxed">{selectedCurso.descripcion}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-atenuado">Módulos del Curso</span>
                      
                      {selectedCurso.bloques.length === 0 ? (
                        <p className="text-xs text-atenuado italic">Sin temario cargado por el momento.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedCurso.bloques.map(b => {
                            const isExpanded = expandedBloque === b.id;
                            return (
                              <div key={b.id} className="border border-linea/60 rounded-xl bg-superficie/10 overflow-hidden card-interactive">
                                <div
                                  onClick={() => setExpandedBloque(isExpanded ? null : b.id)}
                                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-superficie/30 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-verde" /> : <ChevronRight className="w-4 h-4 text-atenuado" />}
                                    <span className="text-xs font-bold text-texto">{b.titulo}</span>
                                  </div>
                                  <span className="text-[10px] text-atenuado font-mono">{b.pildoras.length} clases</span>
                                </div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="border-t border-linea/40 overflow-hidden bg-fondo/45"
                                    >
                                      <div className="p-3 space-y-1.5">
                                        {b.pildoras.length === 0 ? (
                                          <p className="text-[9px] text-atenuado italic pl-6 py-1">Sin clases cargadas.</p>
                                        ) : (
                                          b.pildoras.map(p => (
                                            <div 
                                              key={p.id} 
                                              className="pl-6 pr-3 py-2 flex justify-between items-center text-[11px] text-atenuado hover:text-texto transition-colors"
                                            >
                                              <div className="flex items-center gap-2">
                                                {p.tipo === 'video' ? <Play className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                <span className="font-medium">{p.titulo}</span>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono">{p.duracion_min || 0}m</span>
                                                <Lock className="w-3 h-3 text-atenuado/70" />
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-linea/40 py-8 text-center text-[10px] text-atenuado">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} {brand.nombre}. Todos los derechos reservados. Desarrollado sobre Motor Academias.</p>
        </div>
      </footer>

    </div>
  );
}
