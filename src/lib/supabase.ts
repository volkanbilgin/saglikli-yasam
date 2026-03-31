import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase projen açıldıktan sonra buraya kendi değerlerini yaz:
const SUPABASE_URL = 'https://ulgfcnfcilyroumelnjt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZ2ZjbmZjaWx5cm91bWVsbmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODEzMTAsImV4cCI6MjA5MDU1NzMxMH0.hvnImdaElGR6zpNA1kiio32zr7GZ9y5hPbdsnvpooPU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
