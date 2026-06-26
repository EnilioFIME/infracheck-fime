import { useState } from 'react';
import { supabase } from './supabase/client';

export default function App() {
  // Estados principales de la aplicación
  const [sesionId, setSesionId] = useState(null);
  const [evidencias, setEvidencias] = useState([]);

  // Iniciar una nueva sesión de captura
  const iniciarSesion = () => {
    setSesionId(crypto.randomUUID());
    setEvidencias([]);
  };

  // Manejar la selección o captura de fotos
  const handleCapturarFoto = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const nuevasEvidencias = files.map((file) => ({
      id: crypto.randomUUID(),
      file: file,
      previewUrl: URL.createObjectURL(file),
      status: 'Pendiente', // 'Pendiente' o 'Completa'
      metadata: {
        ubicacion: '',
        categoria: '',
        descripcion: '',
        observaciones: '',
        prioridad: 'Baja',
        activo_relacionado: ''
      }
    }));

    setEvidencias((prev) => [...prev, ...nuevasEvidencias]);
  };

  // Si no hay sesión activa, mostramos la pantalla de inicio
  if (!sesionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">FacilTrack</h1>
        <p className="text-gray-500 mb-8">Sistema de registro de incidencias</p>
        
        <button 
          onClick={iniciarSesion}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform active:scale-95 text-xl"
        >
          + Nueva Evidencia
        </button>
      </div>
    );
  }

  // Si hay sesión activa, mostramos el área de trabajo
  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sesión Activa</h2>
          <p className="text-xs text-gray-400 font-mono">ID: {sesionId.split('-')[0]}</p>
        </div>
        <button 
          onClick={() => setSesionId(null)}
          className="text-red-500 text-sm font-semibold underline"
        >
          Cancelar Sesión
        </button>
      </header>

      {/* Galería Temporal */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {evidencias.map((evidencia) => (
          <div key={evidencia.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <img 
              src={evidencia.previewUrl} 
              alt="Evidencia" 
              className="w-full h-32 object-cover"
            />
            <div className="p-2 text-center">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                evidencia.status === 'Completa' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {evidencia.status}
              </span>
              <button className="mt-2 w-full text-sm text-blue-600 font-semibold border border-blue-600 rounded py-1">
                Agregar Info
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón flotante para agregar más fotos (Input HTML5 oculto) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 flex gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <label className="flex-1 bg-gray-800 text-white text-center font-bold py-3 rounded-lg cursor-pointer">
          + Agregar Foto
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            multiple
            className="hidden" 
            onChange={handleCapturarFoto}
          />
        </label>
        
        <button 
          disabled={evidencias.length === 0 || evidencias.some(e => e.status === 'Pendiente')}
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:bg-gray-400"
        >
          Enviar Todo
        </button>
      </div>
    </div>
  );
}