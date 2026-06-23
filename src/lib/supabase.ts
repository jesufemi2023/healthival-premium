import { createClient } from '@supabase/supabase-js';

// These variables are automatically loaded from your environment/secrets
// The VITE_ prefix allows them to be accessed in the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

let supabaseClient: any;

if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Error initializing real Supabase client:', err);
  }
}

// Fallback Proxy to prevent crashing on import or usage when credentials are of wrong format
if (!supabaseClient) {
  console.warn(
    'Supabase credentials missing or invalid. Client-side database features will be disabled. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
  
  // Safe mock client chain, returning empty promises/placeholders
  const mockFrom = () => {
    const chainObj: any = {
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => chainObj,
      neq: () => chainObj,
      in: () => chainObj,
      order: () => chainObj,
      limit: () => chainObj,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null })
    };
    return chainObj;
  };

  supabaseClient = {
    from: mockFrom,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
}

export const supabase = supabaseClient;

