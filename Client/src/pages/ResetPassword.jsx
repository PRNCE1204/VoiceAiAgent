import React, { useState } from 'react'
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi";
import logo from "../assets/logo.png"
import axios from "axios"
import { ServerUrl } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') || ''
    const otpFromUrl = searchParams.get('otp') || ''

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const strengthLevel = () => {
        if (!newPassword) return 0
        let score = 0
        if (newPassword.length >= 8) score++
        if (/[A-Z]/.test(newPassword)) score++
        if (/[0-9]/.test(newPassword)) score++
        if (/[^A-Za-z0-9]/.test(newPassword)) score++
        return score
    }
    const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const strength = strengthLevel()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) return toast.error("Please fill in all fields.")
        if (newPassword !== confirmPassword) return toast.error("Passwords do not match.")
        if (newPassword.length < 8) return toast.error("Password must be at least 8 characters.")

        setLoading(true)
        try {
            await axios.post(ServerUrl + "/api/auth/reset-password", {
                email,
                otp: otpFromUrl,
                newPassword
            })
            setSuccess(true)
            toast.success("Password reset successfully!")
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password.")
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
                {!success && (
                    <button onClick={() => navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=reset_password`)} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8 bg-transparent border-none cursor-pointer">
                        <FiArrowLeft size={15} /> Back
                    </button>
                )}

                <div className="flex items-center gap-3 mb-8">
                    <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
                    <span className="font-black text-xl text-white tracking-tight">Voxa<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">AI</span></span>
                </div>

                {success ? (
                    /* Success State */
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
                            <FiCheck className="text-emerald-400 text-4xl" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-3">Password Reset!</h1>
                        <p className="text-slate-400 text-sm mb-8">Your password has been updated successfully. You can now sign in with your new password.</p>
                        <button onClick={() => navigate('/login')}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all cursor-pointer border-none">
                            Sign In <FiArrowRight size={15} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/15 to-emerald-500/15 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <HiOutlineShieldCheck className="text-purple-400 text-3xl" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">New Password</h1>
                        <p className="text-slate-400 text-sm mb-8">Choose a strong password for your account.</p>

                        <div
                            style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
                            className="bg-gradient-to-b from-cyan-400/20 via-purple-500/10 to-emerald-500/10 p-[1px]"
                        >
                            <div
                                style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                                className="bg-[#0a0d1e] p-8"
                            >
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                            <input type={showPass ? "text" : "password"} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 transition-all" />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                                                {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                            </button>
                                        </div>
                                        {newPassword && (
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

                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                        <input type={showConfirm ? "text" : "password"} placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                            className={`w-full h-12 pl-11 pr-12 rounded-xl bg-white/[0.04] border text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500/60' : 'border-white/10 focus:border-purple-500/60'}`} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                                            {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                        </button>
                                    </div>
                                    {confirmPassword && confirmPassword !== newPassword && (
                                        <p className="text-red-400 text-xs">Passwords do not match</p>
                                    )}

                                    <button type="submit" disabled={loading}
                                        className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed">
                                        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Reset Password</span><FiArrowRight size={15} /></>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ResetPassword
