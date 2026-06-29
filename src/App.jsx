import { useState } from 'react';
import ModuloCaptura from './ModuloCaptura';
import ModuloReportes from './ModuloReportes';

export default function App() {
  const [vistaActiva, setVistaActiva] = useState('captura'); // 'captura' o 'reportes'

  return (
    <div className="relative">
      {/* Renderizado condicional del módulo activo */}
      {vistaActiva === 'captura' ? <ModuloCaptura /> : <ModuloReportes />}

      {/* Barra de Navegación Inferior (Tabs) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 flex justify-around items-center pb-safe z-50">
        <button 
          onClick={() => setVistaActiva('captura')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
            vistaActiva === 'captura' ? 'text-blue-600' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">CAPTURAR</span>
        </button>

        <button 
          onClick={() => setVistaActiva('reportes')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
            vistaActiva === 'reportes' ? 'text-blue-600' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">REPORTES</span>
        </button>
      </div>
    </div>
  );
}