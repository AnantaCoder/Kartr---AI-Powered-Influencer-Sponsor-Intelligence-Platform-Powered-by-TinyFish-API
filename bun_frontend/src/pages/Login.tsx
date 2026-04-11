import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, loginWithGoogle, selectAuthLoading, selectAuthError, clearError, loginSchema, type LoginFormValues } from '../features/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import KartrLine from '../components/common/KartrLine';
import bg_img from "../assets/auth/bg_img.png";

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const isLoading = useAppSelector(selectAuthLoading);
    const authError = useAppSelector(selectAuthError);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        return () => { dispatch(clearError()); };
    }, [dispatch]);

    const onSubmit = async (data: LoginFormValues) => {
        dispatch(clearError());
        const result = await dispatch(login(data));
        if (login.fulfilled.match(result)) navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#020617] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Card */}
                <div className="relative overflow-hidden rounded-[32px] bg-slate-900/50 backdrop-blur-xl shadow-2xl border border-white/10">
                    {/* Decorative gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                    {/* Header */}
                    <div className="pt-10 pb-6 px-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 shadow-lg shadow-blue-500/10 mb-6 group relative"
                        >
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />
                            <Sparkles className="w-8 h-8 text-blue-400 relative z-10" />
                        </motion.div>

                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            Enter your credentials to access your dashboard
                        </p>

                        <div className="flex justify-center mt-6">
                            <KartrLine width={140} circleSize={24} color="#e11d48" text="Kartr" />
                        </div>
                    </div>

                    {/* Form */}
                    <div className="px-8 pb-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    Email Address
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        {...register('email')}
                                        className="h-14 pl-12 text-base rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                                    />
                                </div>
                                {errors.email && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-red-400 flex items-center gap-1 font-medium ml-1"
                                    >
                                        {errors.email.message}
                                    </motion.p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        {...register('password')}
                                        className="h-14 pl-12 pr-12 text-base rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-red-400 flex items-center gap-1 font-medium ml-1"
                                    >
                                        {errors.password.message}
                                    </motion.p>
                                )}
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Error Message */}
                            {authError && (
                                <motion.div
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p className="text-sm text-red-400 text-center font-medium">
                                        {authError}
                                    </p>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <motion.div whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="submit"
                                    className="w-full h-14 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl shadow-lg shadow-blue-500/25 border border-white/10 transition-all cursor-pointer"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-5 w-5" />
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Log In
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                            </motion.div>

                            {/* Google Sign-In */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                                    <span className="px-4 bg-[#0f1420] text-gray-500 rounded-full">Or continue with</span>
                                </div>
                            </div>

                            <motion.div whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-14 text-base font-semibold rounded-2xl bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer flex items-center justify-center gap-3"
                                    onClick={async () => {
                                        dispatch(clearError());
                                        const result = await dispatch(loginWithGoogle("influencer"));
                                        if (loginWithGoogle.fulfilled.match(result)) navigate('/');
                                    }}
                                    disabled={isLoading}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </Button>
                            </motion.div>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                                <span className="px-4 bg-[#0f1420] text-gray-500 rounded-full">Or create an account</span>
                            </div>
                        </div>

                        {/* Signup Links */}
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/signup-influencer">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-gray-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer font-semibold"
                                >
                                    Influencer
                                </Button>
                            </Link>
                            <Link to="/signup-sponsor">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-gray-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-500/30 transition-all cursor-pointer font-semibold"
                                >
                                    Sponsor
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Back to Home Link */}
                <motion.div
                    className="text-center mt-8"
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

export default Login;
