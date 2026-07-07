import React, { useState } from 'react'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import logo from "../assets/logo.png"
import axios from "axios"
import { ServerUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function SignIn({ setUser }) {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    const btnClip = { clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }

    const handleEmailLogin = async (e) => {
        e.preventDefault()
        if (!email || !password) return toast.error("Please fill in all fields.")
        setLoading(true)
        try {
            const res = await axios.post(ServerUrl + "/api/auth/login", { email, password }, { withCredentials: true })
            setUser(res.data)
            localStorage.setItem("isLoggedIn", "true")
            toast.success("Welcome back!")
            navigate("/")
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed."
            if (err.response?.data?.needsVerification) {
                toast.error("Please verify your email first.")
                navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=verify_email`)
            } else {
                toast.error(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        if (!window.google) { toast.error("Google script still loading."); return; }
        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scope: "openid email profile",
                callback: async (tokenResponse) => {
                    if (tokenResponse?.access_token) {
                        try {
                            const res = await axios.post(ServerUrl + "/api/auth/google", { accessToken: tokenResponse.access_token }, { withCredentials: true })
                            setUser(res.data)
                            localStorage.setItem("isLoggedIn", "true")
                            toast.success("Welcome to VoxaAI!")
                            navigate("/")
                        } catch { toast.error("Login verification failed") }
                    }
                },
                error_callback: () => toast.error("Google auth error occurred")
            })
            client.requestAccessToken()
        } catch { toast.error("Login Failed...") }
    }

    return (
        <div className='min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative flex items-center justify-center'>
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-[130px] pointer-events-none z-0" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

            <div className='max-w-md mx-auto px-6 py-16 relative z-10 w-full'>

                {/* Back */}
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8 bg-transparent border-none cursor-pointer">
                    <FiArrowLeft size={15} /> Back
                </button>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
                    <span className="font-black text-xl text-white tracking-tight">
                        Voxa<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">AI</span>
                    </span>
                </div>

                {/* Heading */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-purple-300 text-xs font-semibold mb-4">
                        <HiOutlineSparkles className="text-purple-400" /> Welcome back
                    </div>
                    <h1 className="text-3xl font-black text-white">Sign in to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">account</span></h1>
                    <p className="text-slate-400 text-sm mt-2">Enter your credentials to continue.</p>
                </div>

                {/* Card */}
                <div
                    style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
                    className="bg-gradient-to-b from-cyan-400/20 via-purple-500/10 to-emerald-500/10 p-[1px]"
                >
                    <div
                        style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                        className="bg-[#0a0d1e] p-8"
                    >
                        {/* Google */}
                        <button
                            onClick={handleGoogleLogin}
                            style={btnClip}
                            className='w-full h-12 px-6 bg-white text-slate-800 text-sm font-bold flex items-center justify-center gap-3 hover:bg-slate-100 hover:scale-[1.01] transform transition-all cursor-pointer border-none mb-5'
                        >
                            <FcGoogle className='text-xl' />
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.06] transition-all"
                                />
                            </div>

                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.06] transition-all"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                                    {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors bg-transparent border-none cursor-pointer">
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={btnClip}
                                className="w-full h-12 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:shadow-[0_0_50px_rgba(139,92,246,0.45)] hover:scale-[1.01] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><span>Sign In</span><FiArrowRight size={15} /></>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/register')} className="text-purple-400 hover:text-purple-300 font-semibold bg-transparent border-none cursor-pointer">
                        Create one free
                    </button>
                </p>
            </div>
        </div>
    )
}

export default SignIn
