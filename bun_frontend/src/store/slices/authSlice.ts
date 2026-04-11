import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User, AuthState, LoginCredentials, SignupInfluencerData, SignupSponsorData } from "../../features/auth/types";
import { loginUser, signupInfluencer, signupSponsor, getCurrentUser, logoutUser, googleLogin } from "../../features/auth/api";

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
  initialized: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await loginUser(credentials);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message || "Login failed");
    }
  }
);

export const registerInfluencer = createAsyncThunk(
  "auth/registerInfluencer",
  async (data: SignupInfluencerData, { rejectWithValue }) => {
    try {
      return await signupInfluencer(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message || "Registration failed");
    }
  }
);

export const registerSponsor = createAsyncThunk(
  "auth/registerSponsor",
  async (data: SignupSponsorData, { rejectWithValue }) => {
    try {
      return await signupSponsor(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message || "Registration failed");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.token) return rejectWithValue("No token available");
      return await getCurrentUser();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Session expired");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  await logoutUser();
  localStorage.removeItem("token");
  // Clean up persisted Virtual AI state
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("virtual_ai_tab_") || key.startsWith("agentic_chat_"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  dispatch(clearAuth());
});

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (userType: string = "influencer", { rejectWithValue }) => {
    try {
      return await googleLogin(userType);
    } catch (error: any) {
      // Handle Firebase popup closed error
      if (error.code === "auth/popup-closed-by-user") {
        return rejectWithValue("Sign-in cancelled");
      }
      return rejectWithValue(error.response?.data?.detail || error.message || "Google sign-in failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.access_token);
      })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(registerInfluencer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerInfluencer.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.access_token);
      })
      .addCase(registerInfluencer.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(registerSponsor.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerSponsor.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.access_token);
      })
      .addCase(registerSponsor.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchCurrentUser.pending, (state) => { state.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        if (state.token) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem("token");
        }
      })
      .addCase(loginWithGoogle.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.access_token);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { setCredentials, clearAuth, clearError, setInitialized } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized;

export default authSlice.reducer;
