// src/supabase/client.js
import { createClient } from '@supabase/supabase-js';

// Vite usa import.meta.env para leer las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos y exportamos el cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);