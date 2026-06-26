// src/App.jsx
import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';

function App() {
  const [status, setStatus] = useState('Probando conexión...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Hacemos una consulta rápida a la tabla (solo pidiendo el id)
        const { data, error } = await supabase
          .from('incidencias')
          .select('id')
          .limit(1);

        if (error) {
          throw error;
        }

        setStatus('¡Conexión exitosa a Supabase! 🚀');
        console.log('Datos recibidos (debe ser un arreglo):', data);
      } catch (err) {
        setStatus('Error en la conexión ❌');
        setError(err.message);
        console.error('Detalle del error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">FacilTrack</h1>
      
      <div className={`p-4 rounded-lg shadow-md ${error ? 'bg-red-100' : 'bg-green-100'}`}>
        <h2 className="text-xl font-semibold text-gray-800">{status}</h2>
        {error && (
          <p className="mt-2 text-red-600 font-mono text-sm">{error}</p>
        )}
      </div>
      
      <p className="mt-6 text-gray-500 text-sm">
        Abre la consola del navegador (F12) para ver los detalles.
      </p>
    </div>
  );
}

export default App;