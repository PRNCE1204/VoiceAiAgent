import React, { useState } from 'react'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import logo from "../assets/logo.png"
import axios from "axios"
import { ServerUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Register() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!name || !email || !password || !confirmPassword) return toast.error("Please fill in all fields.")
        if (password !== confirmPassword) return toast.error("Passwords do not match.")
        if (password.length < 8) return toast.error("Password must be at least 8 characters.")

        setLoading(true)
        try {
            await axios.post(ServerUrl + "/api/auth/register", { name, email, password })
            toast.success("OTP sent! Please check your email.")
            navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=verify_email`)
        } catch (err) {
            const data = err.response?.data
            if (data?.alreadyExists) {
                toast.error("This email is already registered.")
                setTimeout(() => navigate('/signin'), 1500)
            } else {
                toast.error(data?.message || "Registration failed.")
            }
        } finally {
            setLoading(false)
        }
    }

    const strengthLevel = () => {
        if (!password) return 0
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++
        return score
    }
    const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const strength = strengthLevel()

    return (
        <div className='min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative flex items-center justify-center'>
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-[130px] pointer-events-none z-0" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

            <div className='max-w-lg mx-auto px-6 py-16 relative z-10 w-full'>

                {/* Back */}
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8 bg-transparent border-none cursor-pointer">
                    <FiArrowLeft size={15} /> Back to Sign In
                </button>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
                    <span className="font-black text-xl text-white tracking-tight">Voxa<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">AI</span></span>
                </div>

                {/* Heading */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-purple-300 text-xs font-semibold mb-4">
                        <HiOutlineSparkles className="text-purple-400" /> Create your account
                    </div>
                    <h1 className="text-3xl font-black text-white">Get started for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">free</span></h1>
                    <p className="text-slate-400 text-sm mt-2">200 AI responses included. No credit card required.</p>
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
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Name */}
                            <div className="relative">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 transition-all" />
                            </div>
                            {/* Email */}
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 transition-all" />
                            </div>
                            {/* Password */}
                            <div>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                    <input type={showPass ? "text" : "password"} placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 transition-all" />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                                        {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {password && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex gap-1 flex-1">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />
                                            ))}
                                        </div>
                                        <span className={`text-[10px] font-bold ${strength >= 3 ? 'text-emerald-400' : strength === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {strengthLabels[strength]}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Confirm Password */}
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input type={showConfirm ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full h-12 pl-11 pr-12 rounded-xl bg-white/[0.04] border text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all ${confirmPassword && confirmPassword !== password ? 'border-red-500/60' : 'border-white/10 focus:border-purple-500/60'}`} />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                                    {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                </button>
                            </div>
                            {confirmPassword && confirmPassword !== password && (
                                <p className="text-red-400 text-xs">Passwords do not match</p>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:scale-[1.01] transition-all cursor-pointer border-none mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><FiArrowRight size={15} /></>}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <button onClick={() => navigate('/login')} className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 text-sm font-semibold flex items-center justify-center gap-3 hover:bg-white/[0.06] transition-all cursor-pointer">
                            <FcGoogle className='text-xl' /> Sign up with Google
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')} className="text-purple-400 hover:text-purple-300 font-semibold bg-transparent border-none cursor-pointer">Sign in</button>
                </p>
            </div>
        </div>
    )
}

export default Register
