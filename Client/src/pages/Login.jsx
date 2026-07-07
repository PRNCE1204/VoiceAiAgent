import React, { useState } from 'react'
import { HiOutlineSparkles, HiOutlineMicrophone } from "react-icons/hi";
import { HiOutlineBolt, HiOutlineCodeBracket } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { FiMail, FiUserPlus } from "react-icons/fi";
import logo from "../assets/logo.png"
import axios from "axios"
import { ServerUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Login({setUser}) {
    const navigate = useNavigate()

    const FEATURES = [
        { icon: <HiOutlineMicrophone />, title: "Voice AI", desc: "Natural real-time voice conversations." },
        { icon: <HiOutlineSparkles />, title: "Smart Navigation", desc: "Navigate pages using voice commands." },
        { icon: <HiOutlineCodeBracket />, title: "Easy Embed", desc: "Add assistant using one script tag." },
        { icon: <HiOutlineBolt />, title: "Fast Responses", desc: "Optimized Gemini AI responses." }
    ];

    const handleGoogleLogin = () => {
        if (!window.google) {
            toast.error("Google login script is still loading. Please try again in a moment.");
            return;
        }
        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scope: "openid email profile",
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        try {
                            const res = await axios.post(
                                ServerUrl + "/api/auth/google",
                                { accessToken: tokenResponse.access_token },
                                { withCredentials: true }
                            );
                            setUser(res.data);
                            localStorage.setItem("isLoggedIn", "true");
                            toast.success("Welcome to VoxaAI!");
                            navigate("/");
                        } catch {
                            toast.error("Login verification failed");
                        }
                    }
                },
                error_callback: () => toast.error("Google auth error occurred")
            });
            client.requestAccessToken();
        } catch {
            toast.error("Login Failed...");
        }
    };

    // Shared button clip-path style (matching Google button)
    const btnClip = { clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" };

    return (
        <div className='min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative flex items-center justify-center'>
            {/* Background Glow Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-[130px] pointer-events-none z-0" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

            <div className='max-w-7xl mx-auto px-6 py-16 lg:py-24 relative z-10 w-full'>
                <div className='grid lg:grid-cols-2 gap-16 items-center'>

                    {/* ── Left Panel ─────────────────────────────────────── */}
                    <div className="text-left flex flex-col items-start">
                        <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-purple-300 text-sm font-semibold backdrop-blur-md'>
                            <HiOutlineSparkles className="text-purple-400" />
                            AI Voice Assistant Platform
                        </div>

                        <h1 className='mt-8 text-5xl lg:text-7xl font-black leading-tight text-white tracking-tight'>
                            Build AI Assistants
                            <span className='block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-emerald-400 mt-2'>
                                For Any Website
                            </span>
                        </h1>

                        <p className='mt-8 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl'>
                            Create customizable AI voice assistants that talk, guide users, and integrate into any website instantly.
                        </p>

                        {/* ── Auth Buttons ────────────────────────────────── */}
                        <div className="mt-10 w-full max-w-md space-y-4">

                            {/* Google */}
                            <button
                                onClick={handleGoogleLogin}
                                style={btnClip}
                                className='w-full h-14 px-6 bg-white text-slate-800 text-sm font-bold flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.07)] hover:bg-slate-100 hover:scale-[1.01] transform transition-all cursor-pointer border-none'
                            >
                                <FcGoogle className='text-2xl' />
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 !my-5">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* Sign In with Email */}
                            <button
                                onClick={() => navigate('/signin')}
                                style={btnClip}
                                className='w-full h-14 px-6 bg-white/[0.06] border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-3 hover:bg-white/[0.10] hover:border-purple-500/40 hover:scale-[1.01] transform transition-all cursor-pointer'
                            >
                                <FiMail className='text-xl text-purple-400' />
                                Sign In with Email
                            </button>

                            {/* Register */}
                            <button
                                onClick={() => navigate('/register')}
                                style={btnClip}
                                className='w-full h-14 px-6 bg-gradient-to-r from-purple-600/20 to-emerald-600/20 border border-purple-500/30 text-white text-sm font-bold flex items-center justify-center gap-3 hover:from-purple-600/30 hover:to-emerald-600/30 hover:border-purple-500/60 hover:scale-[1.01] shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:shadow-[0_0_35px_rgba(139,92,246,0.2)] transform transition-all cursor-pointer border-none'
                            >
                                <FiUserPlus className='text-xl text-emerald-400' />
                                Create Free Account
                            </button>

                            <p className='text-xs text-slate-500 text-center pt-1'>
                                Free plan includes <span className="text-purple-400 font-semibold">200 AI responses</span>
                            </p>
                        </div>
                    </div>

                    {/* ── Right Panel (Cyber HUD Features Card) ─────────── */}
                    <div className='relative w-full max-w-xl mx-auto lg:mx-0'>
                        <div className='absolute inset-[-10px] bg-gradient-to-r from-purple-500/10 to-emerald-500/10 blur-2xl rounded-[40px] pointer-events-none' />
                        <div
                            style={{ clipPath: "polygon(30px 0%, calc(100% - 30px) 0%, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0% calc(100% - 30px), 0% 30px)" }}
                            className="relative bg-gradient-to-b from-cyan-400 via-purple-500/30 to-emerald-500/20 p-[1.5px] shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                        >
                            <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                            <div className="absolute right-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                            <div
                                style={{ clipPath: "polygon(29px 0%, calc(100% - 29px) 0%, 100% 29px, 100% calc(100% - 29px), calc(100% - 29px) 100%, 29px 100%, 0% calc(100% - 29px), 0% 29px)" }}
                                className="bg-[#050712]/95 p-8 lg:p-10"
                            >
                                <div className='flex items-center justify-between border-b border-white/5 pb-6 mb-8'>
                                    <h2 className='text-2xl font-black text-white uppercase tracking-wider border-l-2 border-cyan-400 pl-3.5'>Features</h2>
                                    <img src={logo} alt="logo" className='h-12 w-auto object-contain' />
                                </div>
                                <div className='space-y-6'>
                                    {FEATURES.map(({icon, title, desc}, index) => (
                                        <div key={index} className='flex gap-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all p-5 text-left group'>
                                            <div className='min-w-[54px] h-[54px] rounded-xl bg-gradient-to-tr from-purple-500/10 to-emerald-500/10 border border-purple-500/30 text-emerald-400 text-2xl flex items-center justify-center group-hover:scale-[1.05] transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]'>
                                               {icon}
                                            </div>
                                            <div>
                                                <h3 className='text-white text-base font-bold'>{title}</h3>
                                                <p className='mt-2 text-xs leading-relaxed text-slate-400'>{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Login
