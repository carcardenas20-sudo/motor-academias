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
      <div className="min-h-screen bg-[#0B0F0E] text-[#E7EDEA] flex flex-col items-center justify-center p-4 w-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#3DD68C]" />
          <p className="text-xs text-[#73827C] font-semibold tracking-wider uppercase">Cargando Academia...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-[#0B0F0E] text-[#E7EDEA] flex flex-col items-center justify-center p-6 w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black mb-2">Error de Conexión</h2>
        <p className="text-xs text-[#73827C] max-w-sm mb-6 leading-relaxed">
          {error || 'No pudimos encontrar la academia solicitada. Revisa el enlace o intenta de nuevo.'}
        </p>
        <Link 
          to="/login"
          className="px-5 py-2.5 bg-[#3DD68C] text-[#0B0F0E] rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E7EDEA] flex flex-col font-sans w-full selection:bg-[#3DD68C]/30 selection:text-[#3DD68C]">
      
      {/* Luces decorativas */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.06] pointer-events-none" 
        style={{ backgroundColor: brand.color_acento }} 
      />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] opacity-[0.04] pointer-events-none bg-blue-500" />

      {/* HEADER */}
      <header className="relative z-10 w-full border-b border-[#26302C]/40 bg-[#0B0F0E]/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.nombre} className="h-8 object-contain" />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0B0F0E] font-black text-sm uppercase"
                style={{ backgroundColor: brand.color_acento }}
              >
                {brand.nombre.charAt(0)}
              </div>
            )}
            <span className="font-black text-sm tracking-tight text-[#E7EDEA]">{brand.nombre}</span>
          </div>

          <Link 
            to={`/${tenantSlug}/login`}
            className="px-4.5 py-2 rounded-xl text-xs font-bold border border-[#26302C] hover:bg-[#26302C]/40 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 flex-grow max-w-6xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col gap-16">
        
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <span 
            className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/10 bg-emerald-500/5 text-[#3DD68C]"
          >
            Academia Oficial
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#E7EDEA]">
            Aprende en <span style={{ color: brand.color_acento }}>{brand.nombre}</span>
          </h1>
          <p className="text-xs md:text-sm text-[#73827C] leading-relaxed">
            {brand.descripcion || 'Bienvenido a nuestra aula virtual. Explora nuestro catálogo de cursos diseñados para llevar tus habilidades al siguiente nivel.'}
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <Link 
              to={`/${tenantSlug}/login`}
              className="px-6 py-3 rounded-xl text-xs font-black bg-[#3DD68C] text-[#0B0F0E] hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Comenzar a aprender
            </Link>
          </div>
        </div>

        {/* CATALOGO DE CURSOS */}
        <div className="space-y-6">
          <div className="border-b border-[#26302C]/40 pb-4">
            <h2 className="text-lg font-bold text-[#E7EDEA] flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: brand.color_acento }} />
              Plan de Estudios y Cursos
            </h2>
            <p className="text-[11px] text-[#73827C] mt-1">Navega a través de los módulos y lecciones disponibles en la academia.</p>
          </div>

          {courses.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#26302C] rounded-2xl bg-[#141A18]/5 text-xs text-[#73827C]">
              No hay cursos publicados actualmente. Vuelve más tarde.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Selector lateral de cursos */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#73827C] mb-1">Cursos del catálogo</span>
                {courses.map(c => {
                  const isSelected = selectedCurso?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedCurso(c); setExpandedBloque(null); }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-[#141A18]/20 border-[#26302C] hover:bg-[#141A18]/40'
                      }`}
                    >
                      <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-[#3DD68C]' : 'text-[#E7EDEA]'}`}>{c.titulo}</h4>
                      {c.descripcion && <p className="text-[10px] text-[#73827C] line-clamp-2 leading-relaxed">{c.descripcion}</p>}
                    </div>
                  );
                })}
              </div>

              {/* Temario del curso activo */}
              <div className="lg:col-span-8 space-y-4">
                {selectedCurso && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl border border-[#26302C] bg-[#141A18]/30">
                      <span className="text-[9px] font-mono uppercase text-[#73827C]">Curso Seleccionado</span>
                      <h3 className="text-base font-black text-[#E7EDEA] mt-1">{selectedCurso.titulo}</h3>
                      {selectedCurso.descripcion && (
                        <p className="text-xs text-[#73827C] mt-2 leading-relaxed">{selectedCurso.descripcion}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#73827C]">Módulos del Curso</span>
                      
                      {selectedCurso.bloques.length === 0 ? (
                        <p className="text-xs text-[#73827C] italic">Sin temario cargado por el momento.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedCurso.bloques.map(b => {
                            const isExpanded = expandedBloque === b.id;
                            return (
                              <div key={b.id} className="border border-[#26302C] rounded-xl bg-[#0b0f0e]/20 overflow-hidden">
                                <div
                                  onClick={() => setExpandedBloque(isExpanded ? null : b.id)}
                                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#141A18]/40 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[#3DD68C]" /> : <ChevronRight className="w-4 h-4 text-[#73827C]" />}
                                    <span className="text-xs font-bold text-[#E7EDEA]">{b.titulo}</span>
                                  </div>
                                  <span className="text-[10px] text-[#73827C] font-mono">{b.pildoras.length} clases</span>
                                </div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="border-t border-[#26302C] overflow-hidden bg-[#0b0f0e]/10"
                                    >
                                      <div className="p-3 space-y-1.5">
                                        {b.pildoras.length === 0 ? (
                                          <p className="text-[9px] text-[#73827C] italic pl-6 py-1">Sin clases cargadas.</p>
                                        ) : (
                                          b.pildoras.map(p => (
                                            <div 
                                              key={p.id} 
                                              className="pl-6 pr-3 py-2 flex justify-between items-center text-[11px] text-[#73827C] hover:text-[#E7EDEA] transition-colors"
                                            >
                                              <div className="flex items-center gap-2">
                                                {p.tipo === 'video' ? <Play className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                <span className="font-medium">{p.titulo}</span>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono">{p.duracion_min || 0}m</span>
                                                <Lock className="w-3 h-3 text-[#73827C]/70" />
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
      <footer className="border-t border-[#26302C]/40 py-8 text-center text-[10px] text-[#73827C]">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} {brand.nombre}. Todos los derechos reservados. Desarrollado sobre Motor Academias.</p>
        </div>
      </footer>

    </div>
  );
}
