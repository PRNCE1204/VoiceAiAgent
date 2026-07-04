import React, { useState } from 'react'
import { FiMail, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { HiOutlineKey } from "react-icons/hi";
import logo from "../assets/logo.png"
import axios from "axios"
import { ServerUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return toast.error("Please enter your email address.")
        setLoading(true)
        try {
            await axios.post(ServerUrl + "/api/auth/forgot-password", { email })
            toast.success("If this email is registered, you'll receive an OTP.")
            navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=reset_password`)
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative flex items-center justify-center'>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-[130px] pointer-events-none z-0" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

            <div className='max-w-md mx-auto px-6 py-16 relative z-10 w-full'>
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8 bg-transparent border-none cursor-pointer">
                    <FiArrowLeft size={15} /> Back to Sign In
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
                    <span className="font-black text-xl text-white tracking-tight">Voxa<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">AI</span></span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/15 to-emerald-500/15 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                    <HiOutlineKey className="text-purple-400 text-3xl" />
                </div>

                <h1 className="text-3xl font-black text-white mb-2">Forgot Password?</h1>
                <p className="text-slate-400 text-sm mb-8">
                    No worries. Enter your email and we'll send you a reset OTP.
                </p>

                <div
                    style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
                    className="bg-gradient-to-b from-cyan-400/20 via-purple-500/10 to-emerald-500/10 p-[1px]"
                >
                    <div
                        style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                        className="bg-[#0a0d1e] p-8"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input
                                    type="email"
                                    placeholder="Your registered email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 transition-all"
                                />
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:scale-[1.01] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><span>Send Reset OTP</span><FiArrowRight size={15} /></>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Remember your password?{' '}
                    <button onClick={() => navigate('/login')} className="text-purple-400 hover:text-purple-300 font-semibold bg-transparent border-none cursor-pointer">Sign in</button>
                </p>
            </div>
        </div>
    )
}

export default ForgotPassword
