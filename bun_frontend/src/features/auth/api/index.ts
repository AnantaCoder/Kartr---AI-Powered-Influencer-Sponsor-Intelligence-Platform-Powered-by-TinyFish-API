import apiClient from "../../../services/apiClient";
import { signInWithGoogle, signOutFromFirebase } from "../../../config/firebase";
import type {
  User,
  AuthResponse,
  LoginCredentials,
  SignupInfluencerData,
  SignupSponsorData,
} from "../types";

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
  return response.data;
};

export const signupInfluencer = async (data: SignupInfluencerData): Promise<AuthResponse> => {
  const payload = {
    username: data.email.split("@")[0] + "_" + Date.now().toString().slice(-4),
    email: data.email,
    password: data.password,
    user_type: "influencer",
    full_name: `${data.firstName}${data.lastName ? " " + data.lastName : ""}`.trim(),
  };
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
};

export const signupSponsor = async (data: SignupSponsorData): Promise<AuthResponse> => {
  const payload = {
    username: data.email.split("@")[0] + "_" + Date.now().toString().slice(-4),
    email: data.email,
    password: data.password,
    user_type: "sponsor",
    full_name: `${data.firstName} ${data.lastName}`.trim(),
  };
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  try {
    // Sign out from Firebase first to clear Google session
    await signOutFromFirebase();
    await apiClient.post("/auth/logout");
  } catch {
    // Ignore errors on logout
  }
};

export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  const response = await apiClient.put<User>("/auth/profile", data);
  return response.data;
};

export const googleLogin = async (userType: string = "influencer"): Promise<AuthResponse> => {
  const idToken = await signInWithGoogle();
  const response = await apiClient.post<AuthResponse>("/auth/google", {
    id_token: idToken,
    user_type: userType,
  });
  return response.data;
};
