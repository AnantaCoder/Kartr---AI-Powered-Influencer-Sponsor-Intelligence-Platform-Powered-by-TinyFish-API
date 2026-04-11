// Types
export * from "./types";

// Schemas - re-exported from features/schemas
export * from "../schemas/authSchema";

// API
export * from "./api";

// Slice - re-exported from features/slices
import authReducerDefault, {
  login,
  registerInfluencer,
  registerSponsor,
  fetchCurrentUser,
  logout,
  loginWithGoogle,
  setCredentials,
  clearAuth,
  clearError,
  setInitialized,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectAuthInitialized,
} from "../../store/slices/authSlice";

export const authReducer = authReducerDefault;
export {
  login,
  registerInfluencer,
  registerSponsor,
  fetchCurrentUser,
  logout,
  loginWithGoogle,
  setCredentials,
  clearAuth,
  clearError,
  setInitialized,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectAuthInitialized,
};
