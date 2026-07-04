import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from "../assets/logo.jpg"
import { FiLogOut, FiMenu, FiX, FiActivity, FiCompass, FiSun, FiMoon } from "react-icons/fi";
import axios from 'axios';
import { ServerUrl } from '../App';
import toast from 'react-hot-toast';

// ── White Navbar Only (Kept identical in both Light and Dark mode) ───────────
function Navbar({ user, setUser, loading = false, darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + "/api/auth/logout", { withCredentials: true })
      setUser(null)
      toast.success("Logout Successfully")
      navigate("/login")
    } catch (error) {
      toast.error("logout failed")
      console.log(error)
    }
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate("/");
      setTimeout(() => {
        const elRetry = document.getElementById(id);
        if (elRetry) elRetry.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <div className='sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-violet-100 shadow-[0_2px_20px_rgba(124,58,237,0.04)] text-slate-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between'>

        {/* Brand Logo Container */}
        <div onClick={() => navigate("/")} className='flex items-center gap-3 cursor-pointer group'>
          <img src={logo} alt="logo" className='h-12 w-auto object-contain rounded-lg border border-slate-100' />
          <h1 className='font-black text-xl text-black tracking-tight leading-none'>
            Voxa<span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-emerald-400'>AI</span>
          </h1>
        </div>

        {/* Center: Desktop Custom Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection("live-voice-demo")} 
            className='text-xs uppercase tracking-wider font-mono font-bold text-slate-600 hover:text-violet-600 transition-all cursor-pointer flex items-center gap-1.5 bg-transparent border-none'
          >
            <FiActivity size={13} /> Live Demo
          </button>
          
          <button 
            onClick={() => scrollToSection("features")} 
            className='text-xs uppercase tracking-wider font-mono font-bold text-slate-600 hover:text-violet-600 transition-all cursor-pointer flex items-center gap-1.5 bg-transparent border-none'
          >
            <FiCompass size={13} /> Features
          </button>
        </div>

        {/* Right side: User Dashboard & theme toggle */}
        <div className='hidden md:flex items-center gap-5'>
          {/* Light/Dark Toggle Switch */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-14 h-7 rounded-full p-1 relative flex items-center justify-between transition-all cursor-pointer border-none ${darkMode ? 'bg-purple-950 border border-purple-500/30' : 'bg-slate-100 border border-slate-200'}`}
          >
            <FiSun size={12} className={darkMode ? 'text-slate-600' : 'text-amber-500'} />
            <FiMoon size={12} className={darkMode ? 'text-purple-400' : 'text-slate-400'} />
            <div 
              className={`absolute w-5 h-5 rounded-full shadow-sm transition-all duration-300 top-1/2 -translate-y-1/2 ${darkMode ? 'left-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]' : 'left-1 bg-white border border-slate-200'}`}
            />
          </button>

          {!loading && user && (
            <div className='flex items-center gap-4'>
              <button 
                onClick={() => navigate("/builder")} 
                style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                className='px-5 py-2.5 bg-black hover:bg-violet-600 text-white font-bold text-xs uppercase tracking-wider hover:scale-[1.03] transition-all cursor-pointer border-none'
              >
                Builder
              </button>

              <button 
                onClick={() => navigate("/billing")} 
                style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                className='px-5 py-2.5 border border-violet-600 bg-white text-violet-700 text-xs font-bold uppercase tracking-wider hover:bg-violet-50 transition-all cursor-pointer'
              >
                Billing
              </button>

              {/* User Profile Console Card */}
              <div className='flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-slate-100 bg-slate-50 shadow-sm'>
                <div className='w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 border border-white/20 shadow-sm'>
                  <span className='text-white text-sm font-extrabold'>
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className='max-w-[120px] text-left'>
                  <p className='text-xs font-bold truncate text-slate-800'>{user.name}</p>
                  <p className='text-[10px] text-slate-500 truncate font-mono'>{user.email}</p>
                </div>
                
                <button 
                  onClick={handleLogout} 
                  className='ml-1 text-slate-500 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none'
                >
                  <FiLogOut size={15}/>
                </button>
              </div>
            </div>
          )}

          {!loading && !user && (
            <button 
              onClick={() => navigate("/login")} 
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
              className='px-6 py-2.5 bg-gradient-to-r from-violet-600 to-black text-white font-extrabold text-xs uppercase tracking-wider hover:scale-[1.02] shadow-[0_4px_15px_rgba(124,58,237,0.15)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.3)] transition-all cursor-pointer border-none'
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile controls */}
        <div className='flex items-center gap-3 md:hidden'>
          {/* Light/Dark Toggle Switch Mobile */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-11 h-6 rounded-full p-0.5 relative flex items-center justify-between transition-all cursor-pointer border-none ${darkMode ? 'bg-purple-950 border border-purple-500/20' : 'bg-slate-100 border border-slate-200'}`}
          >
            <FiSun size={10} className={darkMode ? 'text-slate-600' : 'text-amber-500'} />
            <FiMoon size={10} className={darkMode ? 'text-purple-400' : 'text-slate-400'} />
            <div 
              className={`absolute w-4 h-4 rounded-full transition-all duration-300 top-1/2 -translate-y-1/2 ${darkMode ? 'left-6 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'left-0.5 bg-white border border-slate-200'}`}
            />
          </button>

          {!loading && user && (
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className='p-2 bg-transparent border-none cursor-pointer text-slate-600 hover:text-violet-600'
            >
              {menuOpen ? <FiX size={22}/> : <FiMenu size={22}/>}
            </button>
          )}

          {!loading && !user && (
            <button 
              onClick={() => navigate("/login")} 
              style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
              className='px-4 py-2 text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition-all cursor-pointer border-none bg-gradient-to-r from-violet-600 to-black text-white'
            >
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Mobile Drawer Dropdown */}
      {menuOpen && (
        <div className='md:hidden px-4 pb-6 absolute top-[68px] left-0 w-full z-50 border-b border-slate-100 bg-white/95 backdrop-blur-2xl'>
          <div className='rounded-2xl border border-slate-100 bg-slate-50 shadow-xl p-4 mt-2'>
            <div className='flex items-center gap-3 pb-4 border-b border-slate-100/10'>
              <div className='w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 border border-white/20 shadow-sm'>
                <span className='text-white text-sm font-extrabold'>
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className='flex-1 overflow-hidden text-left'>
                <p className='text-sm font-bold truncate text-slate-800'>{user.name}</p>
                <p className='text-xs text-slate-500 truncate font-mono'>{user.email}</p>  
              </div>
            </div>

            <div className='flex flex-col gap-3 mt-4'>
              <button 
                style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                className='w-full py-3 text-xs font-bold uppercase tracking-wider border-none cursor-pointer bg-black text-white' 
                onClick={() => { navigate("/builder"); setMenuOpen(false); }}
              >
                Builder
              </button>
              
              <button 
                style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                className='w-full py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border border-violet-600 bg-white text-violet-700 hover:bg-violet-50' 
                onClick={() => { navigate("/billing"); setMenuOpen(false); }}
              >
                Billing
              </button>
            </div>

            <button 
              onClick={() => { setMenuOpen(false); handleLogout(); }} 
              style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
              className='mt-4 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-red-50 border border-red-200 text-red-500'
            >
              <FiLogOut size={14}/> Log Out
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}

export default Navbar
