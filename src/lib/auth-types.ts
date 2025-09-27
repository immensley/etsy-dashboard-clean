export interface AuthState {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export const initialAuthState: AuthState = {
  success: false,
  error: undefined,
  redirectTo: "/admin",
};
