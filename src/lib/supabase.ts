import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsokavzaekfauinsyflb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzb2thdnphZWtmYXVpbnN5ZmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjI1NzIsImV4cCI6MjA5NzM5ODU3Mn0.7expJmeiBoCBLFKuqmugqZOOAoNZnfZjBiUCjuiXzm4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);