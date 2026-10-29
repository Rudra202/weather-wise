export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  status: 'loading' | 'authenticated' | 'guest';
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
