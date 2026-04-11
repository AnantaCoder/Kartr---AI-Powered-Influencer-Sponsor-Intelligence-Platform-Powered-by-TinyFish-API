import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ChatBox from './features/chat/components/ChatBot';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchCurrentUser, setInitialized, selectAuthInitialized, selectToken } from './store/slices/authSlice';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const isInitialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    // Initialize auth state on app startup
    if (token) {
      // If we have a token, try to fetch the current user
      dispatch(fetchCurrentUser());
    } else {
      // No token, mark as initialized immediately
      dispatch(setInitialized());
    }
  }, []); // Only run once on mount

  // Show loading spinner while initializing auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <ChatBox />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

