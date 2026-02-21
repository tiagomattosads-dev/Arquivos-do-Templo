import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ynjdbasvikhnpsledunu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluamRiYXN2aWtobnBzbGVkdW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjQzOTgsImV4cCI6MjA4MzkwMDM5OH0.kYa5cARGo6J-zqWD-jsmxisMmLk4jsu4Fe6iIaEVgTM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
