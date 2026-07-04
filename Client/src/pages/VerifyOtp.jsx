import React, { useState, useRef, useEffect } from 'react'
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi";
import logo from "../assets/logo.png"
import axios from "axios"
import { ServerUrl } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

function VerifyOtp({ setUser }) {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') || ''
    const purpose = searchParams.get('purpose') || 'verify_email'

    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(60)
    const [canResend, setCanResend] = useState(false)
    const inputRefs = useRef([])

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown === 0) { setCanResend(true); return; }
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [resendCooldown])

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)
        if (value && index < 5) inputRefs.current[index + 1]?.focus()
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length === 6) {
            setOtp(pasted.split(''))
            inputRefs.current[5]?.focus()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const otpString = otp.join('')
        if (otpString.length !== 6) return toast.error("Please enter all 6 digits.")
        setLoading(true)
        try {
            if (purpose === 'verify_email') {
                const res = await axios.post(ServerUrl + "/api/auth/verify-email", { email, otp: otpString }, { withCredentials: true })
                if (setUser) setUser(res.data)
                toast.success("Email verified! Welcome to VoxaAI 🎉")
                navigate("/")
            } else if (purpose === 'reset_password') {
                navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otpString}`)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP.")
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!canResend) return
        try {
            await axios.post(ServerUrl + "/api/auth/resend-otp", { email, purpose })
            toast.success("New OTP sent to your email.")
            setOtp(['', '', '', '', '', ''])
            setResendCooldown(60)
            setCanResend(false)
            inputRefs.current[0]?.focus()
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend OTP.")
        }
    }

    const isReset = purpose === 'reset_password'

    return (
        <div className='min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative flex items-center justify-center'>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-[130px] pointer-events-none z-0" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

            <div className='max-w-md mx-auto px-6 py-16 relative z-10 w-full'>
                <button onClick={() => navigate(isReset ? '/forgot-password' : '/register')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8 bg-transparent border-none cursor-pointer">
                    <FiArrowLeft size={15} /> Back
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
                    <span className="font-black text-xl text-white tracking-tight">Voxa<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">AI</span></span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/15 to-emerald-500/15 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                    <HiOutlineShieldCheck className="text-purple-400 text-3xl" />
                </div>

                <h1 className="text-3xl font-black text-white mb-2">
                    {isReset ? "Reset Password" : "Verify Email"}
                </h1>
                <p className="text-slate-400 text-sm mb-8">
                    {isReset ? "Enter the OTP we sent to " : "We sent a 6-digit code to "}
                    <span className="text-purple-400 font-semibold">{email}</span>
                </p>

                <div
                    style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
                    className="bg-gradient-to-b from-cyan-400/20 via-purple-500/10 to-emerald-500/10 p-[1px]"
                >
                    <div
                        style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                        className="bg-[#0a0d1e] p-8"
                    >
                        <form onSubmit={handleSubmit}>
                            {/* OTP Input Boxes */}
                            <div className="flex gap-3 justify-between mb-6" onPaste={handlePaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => inputRefs.current[i] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        className={`w-12 h-14 text-center text-xl font-black rounded-xl border bg-white/[0.04] text-white focus:outline-none transition-all ${digit ? 'border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-purple-500/10' : 'border-white/10 focus:border-purple-500/60'}`}
                                    />
                                ))}
                            </div>

                            <button type="submit" disabled={loading || otp.join('').length !== 6}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : isReset ? "Continue" : "Verify Email"
                                }
                            </button>
                        </form>

                        {/* Resend */}
                        <div className="mt-6 text-center">
                            <p className="text-slate-500 text-xs mb-3">Didn't receive the code?</p>
                            <button
                                onClick={handleResend}
                                disabled={!canResend}
                                className="flex items-center gap-2 mx-auto text-sm font-semibold bg-transparent border-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ color: canResend ? '#a78bfa' : '#475569' }}
                            >
                                <FiRefreshCw size={13} className={canResend ? "" : "opacity-50"} />
                                {canResend ? "Resend OTP" : `Resend in ${resendCooldown}s`}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    OTP expires in <span className="text-purple-400 font-semibold">10 minutes</span>
                </p>
            </div>
        </div>
    )
}

export default VerifyOtp
