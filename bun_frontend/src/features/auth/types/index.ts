export interface User {
  id: string | number;
  username: string;
  email: string;
  user_type: "influencer" | "sponsor";
  full_name?: string;
  date_registered?: string;
  email_visible?: boolean;
  keywords?: string[];
  niche?: string;
  bluesky_handle?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupInfluencerData {
  firstName: string;
  lastName?: string;
  mobile: string;
  email: string;
  password: string;
}

export interface SignupSponsorData {
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}
