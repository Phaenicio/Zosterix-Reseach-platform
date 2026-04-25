import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { setAccessTokenInMemory } from './tokenStore';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'researcher' | 'student' | 'supervisor' | 'administrator';
  supervisorStatus: 'none' | 'pending_verification' | 'verified' | 'rejected';
  profileComplete: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_AUTH'; payload: { accessToken: string; user: User } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTH':
      setAccessTokenInMemory(action.payload.accessToken);
      return {
        ...state,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      setAccessTokenInMemory(null);
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Silent refresh on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { access_token, user } = response.data.data;
        setAccessTokenInMemory(access_token);
        dispatch({ type: 'SET_AUTH', payload: { accessToken: access_token, user } });
      } catch (err) {
        setAccessTokenInMemory(null);
        dispatch({ type: 'LOGOUT' });
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
