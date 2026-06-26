import { useState } from 'react';
import { supabase } from './supabase/client';

// ─── Constantes de opciones ───────────────────────────────────────────────────
const CATEGORIAS = ['Mobiliario', 'Eléctrico', 'Plomería', 'Estructural', 'Otro'];
const PRIORIDADES = ['Baja', 'Media', 'Alta'];

const PRIORIDAD_COLORS = {
  Baja:  { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
  Media: { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50 border border-amber-200' },
  Alta:  { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50 border border-red-200' },
};

const FORM_INICIAL = {
  ubicacion: '', categoria: '', descripcion: '', observaciones: '', prioridad: 'Baja',
};

// ─── Componente: Badge de estado ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const esCompleta = status === 'Completa';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${
      esCompleta
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${esCompleta ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      {status}
    </span>
  );
}

// ─── Componente: Tarjeta de evidencia ─────────────────────────────────────────
function EvidenciaCard({ evidencia, onEditar, onEliminar }) {
  const { status, previewUrl, metadata } = evidencia;
  const esCompleta = status === 'Completa';
  const prioColor = PRIORIDAD_COLORS[metadata.prioridad];

  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex flex-col relative border border-zinc-200 ${
      esCompleta ? 'border-l-[3px] border-l-emerald-400' : 'border-l-[3px] border-l-amber-400'
    }`}>
      {/* Botón eliminar */}
      <button
        onClick={() => onEliminar(evidencia.id)}
        aria-label="Eliminar evidencia"
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors active:scale-90"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Imagen */}
      <div className="relative">
        <img src={previewUrl} alt="Evidencia" className="w-full h-36 object-cover" />
        <div className="absolute bottom-2 left-2">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        {esCompleta ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-zinc-800 leading-tight truncate">{metadata.descripcion}</p>
            <p className="text-[10px] text-zinc-400 truncate">{metadata.ubicacion}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">{metadata.categoria}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${prioColor.bg} ${prioColor.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${prioColor.dot}`} />
                {metadata.prioridad}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            Agrega la información<br />de esta foto
          </p>
        )}

        <button
          onClick={() => onEditar(evidencia)}
          className={`w-full text-xs font-semibold rounded-xl py-2 transition-colors ${
            esCompleta
              ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {esCompleta ? 'Editar' : 'Agregar info →'}
        </button>
      </div>
    </div>
  );
}

// ─── Componente: Modal de metadatos ───────────────────────────────────────────
function MetadataModal({ evidencia, formData, setFormData, onGuardar, onCerrar }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg flex flex-col max-h-[92vh] animate-slide-up">
        {/* Handle drag visual */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Header del modal */}
        <div className="px-5 pb-3 flex items-center justify-between border-b border-zinc-100">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Información de la foto</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Los campos con * son obligatorios</p>
          </div>
          <button
            onClick={onCerrar}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview de la foto en el modal */}
        <div className="px-5 pt-4">
          <img src={evidencia.previewUrl} alt="Preview" className="w-full h-28 object-cover rounded-xl" />
        </div>

        {/* Formulario */}
        <form onSubmit={onGuardar} className="px-5 pt-4 pb-6 overflow-y-auto flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Ubicación *</label>
            <input
              required
              type="text"
              placeholder="Ej. Edificio A, Piso 2, Aula 204"
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-zinc-400"
              value={formData.ubicacion}
              onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Categoría *</label>
            <select
              required
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
              value={formData.categoria}
              onChange={e => setFormData({ ...formData, categoria: e.target.value })}
            >
              <option value="" disabled>Selecciona una categoría</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Descripción breve *</label>
            <input
              required
              type="text"
              placeholder="Ej. Lámpara fundida en el techo"
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-zinc-400"
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Observaciones <span className="text-zinc-400 font-normal">(opcional)</span></label>
            <textarea
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-zinc-400 resize-none"
              value={formData.observaciones}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

          {/* Selector de prioridad visual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Prioridad</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORIDADES.map(p => {
                const c = PRIORIDAD_COLORS[p];
                const activo = formData.prioridad === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, prioridad: p })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      activo ? `${c.bg} ${c.text}` : 'border-zinc-200 text-zinc-400 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${activo ? c.dot : 'bg-zinc-300'}`} />
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors mt-1 text-sm"
          >
            Guardar información
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── App principal ────────────────────────────────────────────────────────────
export default function App() {
  const [sesionId, setSesionId] = useState(crypto.randomUUID());
  const [evidencias, setEvidencias] = useState([]);
  const [fotoEditando, setFotoEditando] = useState(null);
  const [formData, setFormData] = useState(FORM_INICIAL);

  const totalFotos = evidencias.length;
  const totalCompletas = evidencias.filter(e => e.status === 'Completa').length;
  const puedeEnviar = totalFotos > 0 && totalCompletas === totalFotos;
  const hayPendientes = totalFotos > 0 && totalCompletas < totalFotos;

  const iniciarNuevaSesion = () => {
    if (totalFotos > 0 && !window.confirm('¿Descartar las fotos actuales y comenzar de nuevo?')) return;
    setSesionId(crypto.randomUUID());
    setEvidencias([]);
  };

  const handleCapturarFoto = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const nuevas = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'Pendiente',
      metadata: { ...FORM_INICIAL },
    }));
    setEvidencias(prev => [...prev, ...nuevas]);
    // Reset el input para permitir re-seleccionar la misma foto
    e.target.value = '';
  };

  const eliminarFoto = (id) => {
    setEvidencias(prev => prev.filter(f => f.id !== id));
  };

  const abrirModal = (evidencia) => {
    setFotoEditando(evidencia);
    setFormData({ ...evidencia.metadata });
  };

  const guardarMetadata = (e) => {
    e.preventDefault();
    setEvidencias(prev => prev.map(f =>
      f.id === fotoEditando.id ? { ...f, metadata: { ...formData }, status: 'Completa' } : f
    ));
    setFotoEditando(null);
  };

  const handleEnviar = async () => {
    alert('¡Listo para subir a Supabase! (Lógica pendiente)');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col pb-28 max-w-lg mx-auto">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-zinc-100 px-5 py-3.5 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">InfraCheck</h1>
          <p className="text-[10px] text-zinc-400 font-mono">
            sesión {sesionId.slice(0, 8)}
          </p>
        </div>
        <button
          onClick={iniciarNuevaSesion}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          Nueva sesión
        </button>
      </header>

      {/* Contador de progreso (solo si hay fotos) */}
      {totalFotos > 0 && (
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-zinc-600">
              {totalCompletas} de {totalFotos} completadas
            </span>
            {puedeEnviar && (
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Listo para enviar
              </span>
            )}
          </div>
          <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                puedeEnviar ? 'bg-emerald-400' : 'bg-blue-500'
              }`}
              style={{ width: `${totalFotos > 0 ? (totalCompletas / totalFotos) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Título de sección */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-2xl font-bold text-zinc-900">
          {totalFotos === 0 ? 'Evidencias' : `${totalFotos} foto${totalFotos > 1 ? 's' : ''}`}
        </h2>
        {hayPendientes && (
          <p className="text-xs text-zinc-400 mt-0.5">
            {totalFotos - totalCompletas} pendiente{(totalFotos - totalCompletas) > 1 ? 's' : ''} de completar
          </p>
        )}
      </div>

      {/* Contenido principal */}
      <main className="flex-1 px-5">
        {totalFotos === 0 ? (
          // Estado vacío
          <label className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
              <svg className="w-7 h-7 text-zinc-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-500 group-hover:text-blue-600 transition-colors">
              Toca para agregar fotos
            </p>
            <p className="text-xs text-zinc-400 mt-1">Cámara o galería · Múltiples a la vez</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handleCapturarFoto}
            />
          </label>
        ) : (
          // Galería de evidencias
          <div className="grid grid-cols-2 gap-3">
            {evidencias.map(ev => (
              <EvidenciaCard
                key={ev.id}
                evidencia={ev}
                onEditar={abrirModal}
                onEliminar={eliminarFoto}
              />
            ))}

            {/* Botón para agregar más fotos dentro de la galería */}
            <label className="flex flex-col items-center justify-center h-full min-h-[160px] border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-zinc-400 group-hover:text-blue-500 transition-colors text-center px-3">
                Agregar más fotos
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleCapturarFoto}
              />
            </label>
          </div>
        )}
      </main>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 bg-white/90 backdrop-blur-sm border-t border-zinc-100 flex gap-3 z-20">

        {/* Botón cámara */}
        <label className="flex-shrink-0 w-14 h-14 bg-zinc-900 hover:bg-zinc-700 text-white flex items-center justify-center rounded-2xl cursor-pointer transition-colors active:scale-95">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleCapturarFoto}
          />
        </label>

        {/* Botón enviar principal */}
        <button
          onClick={handleEnviar}
          disabled={!puedeEnviar}
          className={`flex-1 h-14 font-semibold rounded-2xl text-sm transition-all active:scale-[0.98] ${
            puedeEnviar
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
              : hayPendientes
                ? 'bg-amber-50 border-2 border-amber-200 text-amber-600 cursor-not-allowed'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {totalFotos === 0
            ? 'Agrega fotos para comenzar'
            : hayPendientes
              ? `Falta info en ${totalFotos - totalCompletas} foto${(totalFotos - totalCompletas) > 1 ? 's' : ''}`
              : 'Enviar evidencias →'}
        </button>
      </div>

      {/* Modal de metadatos */}
      {fotoEditando && (
        <MetadataModal
          evidencia={fotoEditando}
          formData={formData}
          setFormData={setFormData}
          onGuardar={guardarMetadata}
          onCerrar={() => setFotoEditando(null)}
        />
      )}
    </div>
  );
}