import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import emailjs from '@emailjs/browser';
import { supabase } from './supabase/client';

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIAS = ['Todas', 'Mobiliario', 'Eléctrico', 'Plomería', 'Estructural', 'Otro'];

const FORM_FILTROS_INICIAL = {
  ubicacion: '',
  categoria: 'Todas',
  fechaInicio: '',
  fechaFin: ''
};

// ─── Utilidades para el PDF ───────────────────────────────────────────────────

// Convierte la URL pública de Supabase a Base64 para evitar bloqueos al generar el PDF
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error al convertir imagen a base64:", error);
    return ""; // Regresa vacío si falla para que el PDF no crashee
  }
};

// Genera el HTML string exacto que se convertirá a PDF
const generarHTMLReporte = (incidencias, filtros) => {
  const centroCostos = filtros.ubicacion || 'General';
  const fechaGeneracion = new Date().toLocaleString('es-MX');

  const cardsHTML = incidencias.map(incidencia => `
    <div class="page-container"> 
      <div class="card">
        <img src="${incidencia.base64Foto}" alt="Evidencia" />
        <div class="gallery-badge">
          <div class="card-info">
            <span class="id-badge">${incidencia.categoria}</span>
          </div>
          <div class="card-info">
            <span class="id-badge">${incidencia.ubicacion}</span>
          </div>
        </div>
        <p class="card-description"><strong>Reporte:</strong> ${incidencia.descripcion}</p>
        ${incidencia.observaciones ? `<p class="card-description" style="color: #666;"><strong>Notas:</strong> ${incidencia.observaciones}</p>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: letter; margin: 40px; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; margin: 0; padding: 0; }
        table.main-table { width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        tbody { display: table-row-group; }
        .header-content { border-bottom: 3px solid #2563EB; padding-bottom: 10px; margin-bottom: 20px; }
        .header-layout-table { width: 100%; border-collapse: collapse; border: none; }
        .header-layout-table td { border: none; vertical-align: top; }
        .header-text h1 { color: #000; font-size: 24px; margin: 0 0 4px 0; }
        .header-text p { color: #000; font-size: 13px; margin: 3px 0; }
        .header-text .subtitle { color: #808080; font-size: 11px; font-style: italic; }
        .header-logo { text-align: right; width: 160px; }
        .page-container { page-break-inside: avoid; display: block; margin-bottom: 25px; }
        .card { background: white; border-radius: 10px; border: 1px solid #d4d4d8; padding: 12px; width: 100%; max-width: 640px; margin: 0 auto; box-sizing: border-box; }
        .card img { width: 100%; height: 320px; object-fit: contain; border-radius: 6px; display: block; margin-bottom: 10px; background-color: #f4f4f5; }
        .gallery-badge { display: block; margin-bottom: 8px; }
        .card-info { display: inline-block; margin-right: 5px; }
        .card-info .id-badge { background: #2563EB; color: white; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .card-description { margin: 10px 3px 5px 3px; font-size: 13px; color: #444; line-height: 1.4; }
      </style>
    </head>
    <body>
      <table class="main-table">
        <thead>
          <tr>
            <td>
              <div class="header-content">
                <table class="header-layout-table">
                  <tr>
                    <td class="header-text">
                      <h1>Reporte de Evidencias</h1>
                      <p><strong>Ubicación:</strong> ${centroCostos} | <strong>Periodo:</strong> ${filtros.fechaInicio} al ${filtros.fechaFin}</p>
                      <p class="subtitle">Generado el ${fechaGeneracion}</p>
                    </td>
                    <td class="header-logo">
                      <h2 style="color: #2563EB; margin:0; font-size:22px; font-weight:900; letter-spacing: -0.5px;">InfraCheck</h2>
                      <p style="margin:0; font-size:12px; color:#71717a; font-weight: 600;">FIME - UANL</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              ${cardsHTML}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
};

// ─── Componente: Modal de Filtros ─────────────────────────────────────────────
function FiltrosModal({ formData, setFormData, onGuardar, onCerrar }) {
  // Validación ESTRICTA: Todos los campos obligatorios deben llenarse
  const esValido = 
    formData.ubicacion.trim() !== '' && 
    formData.categoria !== 'Todas' && 
    formData.fechaInicio !== '' && 
    formData.fechaFin !== '';

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-100 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg flex flex-col max-h-[92vh] animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        <div className="px-5 pb-3 flex items-center justify-between border-b border-zinc-100">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Nuevo Reporte</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Configura los filtros a incluir</p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="form-filtros" onSubmit={(e) => { e.preventDefault(); onGuardar(); }} className="px-5 pt-4 pb-4 overflow-y-auto flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Filtrar por Ubicación *</label>
            <input type="text" placeholder="Ej. Edificio A" className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-zinc-400" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Filtrar por Categoría *</label>
            <select className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Desde *</label>
              <input type="date" className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-zinc-700" value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Hasta *</label>
              <input type="date" min={formData.fechaInicio} className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-zinc-700" value={formData.fechaFin} onChange={e => setFormData({ ...formData, fechaFin: e.target.value })} />
            </div>
          </div>
        </form>

        <div className="px-5 pb-6 pt-3 border-t border-zinc-100 bg-white">
          <button type="submit" form="form-filtros" disabled={!esValido} className={`w-full font-semibold py-3.5 rounded-xl transition-all text-sm ${esValido ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
            Guardar Reporte a Generar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App Principal (Módulo Reportes) ──────────────────────────────────────────
export default function ModuloReportes() {
  const [emailDestino, setEmailDestino] = useState('');
  const [reportesPendientes, setReportesPendientes] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtrosForm, setFiltrosForm] = useState(FORM_FILTROS_INICIAL);
  const [isGenerando, setIsGenerando] = useState(false);

  const agregarReporte = () => {
    const nuevoReporte = { id: crypto.randomUUID(), nombre: `Reporte ${filtrosForm.ubicacion || filtrosForm.categoria}`, filtros: { ...filtrosForm } };
    setReportesPendientes([...reportesPendientes, nuevoReporte]);
    setModalAbierto(false);
    setFiltrosForm(FORM_FILTROS_INICIAL);
  };

  const eliminarReporte = (id) => { setReportesPendientes(prev => prev.filter(r => r.id !== id)); };

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino);
  const puedeEnviar = reportesPendientes.length > 0 && emailValido && !isGenerando;

  const handleGenerarYEnviar = async () => {
    setIsGenerando(true);
    try {
      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

      for (const reporte of reportesPendientes) {
        const { ubicacion, categoria, fechaInicio, fechaFin } = reporte.filtros;
        const fechaFinAjustada = `${fechaFin}T23:59:59.999Z`;
        const fechaInicioAjustada = `${fechaInicio}T00:00:00.000Z`;

        // 1. Obtener información de la base de datos
        const { data: incidencias, error: dbError } = await supabase
          .from('incidencias')
          .select('*')
          .ilike('ubicacion', `%${ubicacion}%`)
          .eq('categoria', categoria)
          .gte('created_at', fechaInicioAjustada)
          .lte('created_at', fechaFinAjustada);

        if (dbError) throw dbError;

        if (!incidencias || incidencias.length === 0) {
          alert(`El ${reporte.nombre} no encontró coincidencias en la base de datos. Se omitirá.`);
          continue; 
        }

        // 2. Descargar las imágenes y pasarlas a Base64
        const incidenciasConBase64 = await Promise.all(
          incidencias.map(async (incidencia) => {
            const base64Foto = await urlToBase64(incidencia.foto_url);
            return { ...incidencia, base64Foto };
          })
        );

        // 3. Inyectar datos en la plantilla HTML
        const htmlString = generarHTMLReporte(incidenciasConBase64, reporte.filtros);

        // 4. Configurar html2pdf y ejecutar la conversión
        const opt = {
          margin:       0,
          filename:     `reporte_${reporte.id.split('-')[0]}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(opt).from(htmlString).output('blob');

        // 5. Subir a Supabase Storage
        const pdfName = `reporte_${Date.now()}_${reporte.id.split('-')[0]}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('reportes_pdf')
          .upload(pdfName, pdfBlob, { contentType: 'application/pdf' });

        if (uploadError) throw uploadError;

        // 6. Obtener URL y mandar correo
        const { data: { publicUrl } } = supabase.storage
          .from('reportes_pdf')
          .getPublicUrl(pdfName);

        const templateParams = {
          destinatario: emailDestino,
          fecha_reporte: new Date().toLocaleDateString(),
          link_pdf: publicUrl,
        };

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          templateParams
        );
      }

      alert('¡Todos los reportes configurados han sido procesados y enviados exitosamente!');
      setReportesPendientes([]);
      setEmailDestino('');

    } catch (error) {
      console.error('Error detallado:', error);
      alert("Hubo un error al procesar la solicitud: " + error.message);
    } finally {
      setIsGenerando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-zinc-100 px-5 py-3.5 flex items-center sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">Distribución</h1>
          <p className="text-[10px] text-zinc-400 font-mono">Generador de Reportes</p>
        </div>
      </header>

      <main className="flex-1 px-5 pt-5 flex flex-col gap-6">
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
            <h2 className="text-sm font-bold text-zinc-800">Correo Destino</h2>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <input type="email" placeholder="responsable@institucion.edu" className="w-full outline-none text-sm bg-transparent placeholder:text-zinc-400 text-zinc-800" value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} />
          </div>
          {!emailValido && emailDestino.length > 0 && <p className="text-[10px] text-red-500 mt-1.5 ml-2">Ingresa un correo electrónico válido.</p>}
        </section>

        <section className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
              <h2 className="text-sm font-bold text-zinc-800">Reportes a Generar</h2>
            </div>
            <span className="text-xs font-semibold text-zinc-500 bg-zinc-200/50 px-2.5 py-0.5 rounded-full">{reportesPendientes.length}</span>
          </div>

          {reportesPendientes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-zinc-300 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
              <p className="text-sm font-semibold text-zinc-500">Sin reportes pendientes</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] text-center">Toca el botón inferior para configurar un nuevo reporte PDF.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reportesPendientes.map((reporte) => (
                <div key={reporte.id} className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2 relative group">
                  <button onClick={() => eliminarReporte(reporte.id)} className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  <h3 className="text-sm font-bold text-zinc-800 pr-8 truncate">{reporte.nombre}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">Ubic: {reporte.filtros.ubicacion}</span>
                    <span className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">Cat: {reporte.filtros.categoria}</span>
                    <span className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">Desde: {reporte.filtros.fechaInicio}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-20 left-0 right-0 px-5 py-4 bg-white/90 backdrop-blur-sm border-t border-zinc-100 flex gap-3 z-10">
        <button onClick={() => setModalAbierto(true)} className="flex-shrink-0 bg-white border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold px-4 rounded-2xl text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center">
          + Nuevo
        </button>
        <button onClick={handleGenerarYEnviar} disabled={!puedeEnviar} className={`flex-1 h-12 font-semibold rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isGenerando ? 'bg-blue-400 text-white cursor-wait shadow-inner' : puedeEnviar ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
          {isGenerando ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Procesando...</> : 'Generar y Enviar →'}
        </button>
      </div>

      {modalAbierto && <FiltrosModal formData={filtrosForm} setFormData={setFiltrosForm} onCerrar={() => setModalAbierto(false)} onGuardar={agregarReporte} />}
    </div>
  );
}