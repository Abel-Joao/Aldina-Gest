import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://adzslgrktdundlozmcoa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkenNsZ3JrdGR1bmRsb3ptY29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTgzNjAsImV4cCI6MjA2MzU5NDM2MH0.TiKGjuFP8EuUl8iQodP-0R-I4Q5zr92K9pyZk26tLjE';

export interface UserProfile {
  id: string;
  email: string;
  nome?: string;
  empresa?: string;
  telefone?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

const AUTH_KEY = 'aldina_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session?.access_token && session?.user) {
          setToken(session.access_token);
          setUser({
            id: session.user.id,
            email: session.user.email,
            nome: session.user.user_metadata?.nome,
            empresa: session.user.user_metadata?.empresa,
          });
        }
      }
    } catch {}
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error_description || err?.message || 'Credenciais inválidas');
    }

    const data = await res.json();
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setToken(data.access_token);
    setUser({
      id: data.user.id,
      email: data.user.email,
      nome: data.user.user_metadata?.nome,
      empresa: data.user.user_metadata?.empresa,
    });
  }

  async function signOut() {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
