import React, { useState } from 'react';
import { motion } from "framer-motion";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import KartrLine from '../components/common/KartrLine';
import bg_img from "../assets/auth/bg_img.png";

// Schema for forgot password
const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        setIsLoading(false);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{
                backgroundImage: `url(${bg_img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30" />

            <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Card */}
                <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
                    {/* Decorative gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                    {!isSubmitted ? (
                        <>
                            {/* Header */}
                            <div className="pt-10 pb-6 px-8 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 mb-6"
                                >
                                    <Mail className="w-8 h-8 text-white" />
                                </motion.div>

                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Forgot Password?
                                </h1>
                                <p className="text-gray-600">
                                    No worries! Enter your email and we'll send you reset instructions.
                                </p>

                                <div className="flex justify-center mt-4">
                                    <KartrLine width={140} circleSize={24} color="#e11d48" text="Kartr" />
                                </div>
                            </div>

                            {/* Form */}
                            <div className="px-8 pb-8">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                {...register('email')}
                                                className="h-12 pl-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        {errors.email && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm text-red-500 flex items-center gap-1"
                                            >
                                                {errors.email.message}
                                            </motion.p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <motion.div whileTap={{ scale: 0.98 }}>
                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Sending...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Send Reset Link
                                                    <Send className="w-5 h-5" />
                                                </span>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>

                                {/* Back to Login */}
                                <div className="text-center mt-6">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Success State */
                        <div className="py-12 px-8 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
                            >
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    Check Your Email
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    We've sent a password reset link to:
                                    <br />
                                    <span className="font-medium text-gray-800">{submittedEmail}</span>
                                </p>

                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">
                                        Didn't receive the email? Check your spam folder or
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsSubmitted(false)}
                                        className="rounded-xl cursor-pointer"
                                    >
                                        Try another email
                                    </Button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Back to Home Link */}
                <motion.div
                    className="text-center mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Link to="/" className="text-white/80 hover:text-white text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
