import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerSponsor, loginWithGoogle, selectAuthLoading, selectAuthError, clearError, signupSponsorSchema, type SignupSponsorFormValues } from '../features/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, User, Mail, Lock, Building2, ArrowRight, Briefcase, Loader2 } from 'lucide-react';
import KartrLine from '../components/common/KartrLine';
import bg_img from "../assets/auth/bg_img.png";

const SignupSponsor: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isLoading = useAppSelector(selectAuthLoading);
  const authError = useAppSelector(selectAuthError);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupSponsorFormValues>({
    resolver: zodResolver(signupSponsorSchema),
  });

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const onSubmit = async (data: SignupSponsorFormValues) => {
    dispatch(clearError());
    const result = await dispatch(registerSponsor(data));
    if (registerSponsor.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#020617] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900/50 backdrop-blur-xl shadow-2xl border border-white/10">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

          {/* Header */}
          <div className="pt-8 pb-4 px-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 shadow-lg shadow-blue-500/10 mb-4 group relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />
              <Briefcase className="w-7 h-7 text-blue-400 relative z-10" />
            </motion.div>

            <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
              Join as a Sponsor
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Connect with top influencers for your brand
            </p>

            <div className="flex justify-center mt-4">
              <KartrLine width={140} circleSize={24} color="#e11d48" text="Kartr" />
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    First Name
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      {...register('firstName')}
                      className="h-11 pl-10 text-sm rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-400 ml-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    {...register('lastName')}
                    className="h-11 text-sm rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-400 ml-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Organization / Brand
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <Input
                    id="organization"
                    placeholder="Enter your company name"
                    {...register('organization')}
                    className="h-11 pl-10 text-sm rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>
                {errors.organization && (
                  <p className="text-xs text-red-400 ml-1">{errors.organization.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Work Email
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your work email"
                    {...register('email')}
                    className="h-11 pl-10 text-sm rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    {...register('password')}
                    className="h-11 pl-10 pr-10 text-sm rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {authError && (
                <motion.div
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-red-400 text-center font-medium">
                    {authError}
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/25 border border-white/10 transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Sponsor Account
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Google Sign-In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="px-4 bg-[#0f1420] text-gray-500 rounded-full">Or</span>
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-sm font-semibold rounded-xl bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  onClick={async () => {
                    dispatch(clearError());
                    const result = await dispatch(loginWithGoogle("sponsor"));
                    if (loginWithGoogle.fulfilled.match(result)) navigate('/');
                  }}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign up with Google
                </Button>
              </motion.div>
            </form>

            {/* Login Link */}
            <div className="text-center mt-5">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <motion.div
          className="text-center mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/" className="text-gray-500 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupSponsor;