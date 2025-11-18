// Auth feature types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface PasswordResetPayload {
  token: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface SignUpPayload extends AuthCredentials {
  name: string;
  role: "employer" | "job_seeker";
}
