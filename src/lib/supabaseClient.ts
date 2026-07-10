import { createClient } from '@supabase/supabase-js';

let supabaseUrlRaw = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
if (supabaseUrlRaw) {
  try {
    const urlObj = new URL(supabaseUrlRaw);
    supabaseUrlRaw = urlObj.origin;
  } catch (err) {
    if (supabaseUrlRaw.endsWith('/')) {
      supabaseUrlRaw = supabaseUrlRaw.slice(0, -1);
    }
  }
  // Safeguard against copy-pasting API endpoint directly
  if (supabaseUrlRaw.includes('/rest/v1')) {
    supabaseUrlRaw = supabaseUrlRaw.split('/rest/v1')[0];
  }
}
const supabaseUrl = supabaseUrlRaw;
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export { isSupabaseConfigured };

// Fallback Mock Storage for Offline/Simulation mode
const mockStorage = {
  get: (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  },
  set: (key: string, val: any) => {
    localStorage.setItem(key, JSON.stringify(val));
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  }
};

let supabaseClientInstance: any;

if (isSupabaseConfigured) {
  try {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Erro ao inicializar Supabase real. Ativando simulador de contingência.", err);
  }
}

// If real client is not initialized, we build a seamless Mock Client
if (!supabaseClientInstance) {
  console.warn("⚠️ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas. Ativando simulador offline da AQUAR.IA.");
  
  // Custom auth listeners
  const listeners: Array<(event: string, session: any) => void> = [];
  
  supabaseClientInstance = {
    auth: {
      getSession: async () => {
        const session = mockStorage.get('aquaria_simulated_session');
        return { data: { session }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.push(callback);
        // Initial call
        const session = mockStorage.get('aquaria_simulated_session');
        setTimeout(() => callback('SIGNED_IN', session), 10);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = listeners.indexOf(callback);
                if (index > -1) listeners.splice(index, 1);
              }
            }
          }
        };
      },
      signUp: async ({ email, password, options }: any) => {
        const mockUser = {
          id: 'simulated-user-uuid-1234',
          email,
          user_metadata: options?.data || {}
        };
        const mockSession = {
          access_token: 'simulated-jwt-token-abcd',
          user: mockUser
        };
        
        const mockProfile = {
          id: mockUser.id,
          full_name: options?.data?.full_name || 'Usuário de Teste',
          whatsapp_number: options?.data?.whatsapp_number || '',
          subscription_tier: 'FREE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockStorage.set('aquaria_simulated_profile', mockProfile);
        mockStorage.set('aquaria_simulated_session', mockSession);
        
        listeners.forEach(cb => cb('SIGNED_IN', mockSession));
        return { data: { user: mockUser, session: mockSession }, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const existingSession = mockStorage.get('aquaria_simulated_session');
        if (existingSession && existingSession.user.email === email) {
          listeners.forEach(cb => cb('SIGNED_IN', existingSession));
          return { data: existingSession, error: null };
        }
        
        const mockUser = {
          id: 'simulated-user-uuid-1234',
          email,
          user_metadata: { full_name: 'Usuário de Teste', whatsapp_number: '+5511999999999' }
        };
        const mockSession = {
          access_token: 'simulated-jwt-token-abcd',
          user: mockUser
        };
        
        let mockProfile = mockStorage.get('aquaria_simulated_profile');
        if (!mockProfile) {
          mockProfile = {
            id: mockUser.id,
            full_name: 'Usuário de Teste',
            whatsapp_number: '+55 11 99999-9999',
            subscription_tier: 'FREE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          mockStorage.set('aquaria_simulated_profile', mockProfile);
        }
        
        mockStorage.set('aquaria_simulated_session', mockSession);
        listeners.forEach(cb => cb('SIGNED_IN', mockSession));
        return { data: mockSession, error: null };
      },
      signOut: async () => {
        mockStorage.remove('aquaria_simulated_session');
        mockStorage.remove('aquaria_simulated_profile');
        listeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      }
    },
    from: (table: string) => {
      return {
        select: (fields?: string) => {
          return {
            eq: (field: string, val: any) => {
              return {
                single: async () => {
                  if (table === 'profiles') {
                    const profile = mockStorage.get('aquaria_simulated_profile');
                    if (profile) return { data: profile, error: null };
                    
                    const newProfile = {
                      id: val,
                      full_name: 'Usuário de Teste',
                      whatsapp_number: '+55 11 99999-9999',
                      subscription_tier: 'FREE',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    mockStorage.set('aquaria_simulated_profile', newProfile);
                    return { data: newProfile, error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                }
              };
            }
          };
        },
        upsert: async (payload: any) => {
          if (table === 'profiles') {
            mockStorage.set('aquaria_simulated_profile', payload);
            return { error: null };
          }
          return { error: null };
        },
        update: (payload: any) => {
          return {
            eq: (field: string, val: any) => {
              return {
                then: async (resolve: any) => {
                  if (table === 'profiles') {
                    const profile = mockStorage.get('aquaria_simulated_profile') || {};
                    const updated = { ...profile, ...payload };
                    mockStorage.set('aquaria_simulated_profile', updated);
                    resolve({ data: updated, error: null });
                  } else {
                    resolve({ data: null, error: null });
                  }
                }
              };
            }
          };
        }
      };
    }
  };
}

export const supabase = supabaseClientInstance;
