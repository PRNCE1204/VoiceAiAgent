import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiMic, 
  FiArrowRight, 
  FiCpu, 
  FiCompass, 
  FiSliders, 
  FiShield, 
  FiLayers,
  FiActivity,
  FiTerminal,
  FiSettings
} from "react-icons/fi";
import logo from "../assets/logo.jpg"

// ── Custom Mouse-Move 3D Tilt Hook for Card Components ──────────────────────────
function use3DTiltAndScrollCard(maxRotation = 10) {
  const [hoverState, setHoverState] = useState({ x: 0, y: 0, active: false });
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const card = ref.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;

    const rotateY = ((x - xc) / xc) * maxRotation;
    const rotateX = -((y - yc) / yc) * maxRotation;

    setHoverState({ x: rotateX, y: rotateY, active: true });
  };

  const handleMouseLeave = () => {
    setHoverState({ x: 0, y: 0, active: false });
  };

  return {
    ref,
    hoverActive: hoverState.active,
    hoverX: hoverState.x,
    hoverY: hoverState.y,
    bind: {
      ref,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave
    }
  };
}

// ── Custom Hook to track Scroll Progress of a specific Ref ──────────────────────
function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const calculateProgress = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const elementHeight = rect.height;
      const startPos = viewportHeight; // Top of element enters bottom of screen
      const endPos = -elementHeight;   // Bottom of element leaves top of screen
      const currentPos = rect.top;

      const totalDistance = startPos - endPos;
      const currentDistance = startPos - currentPos;

      const rawProgress = currentDistance / totalDistance;
      setProgress(Math.max(0, Math.min(1, rawProgress)));
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateProgress);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    calculateProgress();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return [ref, progress];
}

function Home({ user }) {
  const navigate = useNavigate();
  
  // Scroll and Morph coordinates state
  const [scrollY, setScrollY] = useState(0);
  const [offsets, setOffsets] = useState({ dx: 0, dy: 0 });
  const [hoverState, setHoverState] = useState({ x: 0, y: 0, active: false });

  const heroScreenTargetRef = useRef(null);
  const demoScreenTargetRef = useRef(null);

  // Track window scroll and compute relative device morph offsets
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const calculateOffsets = () => {
      if (heroScreenTargetRef.current && demoScreenTargetRef.current) {
        const heroRect = heroScreenTargetRef.current.getBoundingClientRect();
        const demoRect = demoScreenTargetRef.current.getBoundingClientRect();
        
        const heroAbsX = heroRect.left + window.scrollX;
        const heroAbsY = heroRect.top + window.scrollY;
        const demoAbsX = demoRect.left + window.scrollX;
        const demoAbsY = demoRect.top + window.scrollY;

        setOffsets({
          dx: demoAbsX - heroAbsX,
          dy: demoAbsY - heroAbsY
        });
      }
    };

    calculateOffsets();
    window.addEventListener("resize", calculateOffsets);
    const timer = setTimeout(calculateOffsets, 600); // safety catch post render

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", calculateOffsets);
      clearTimeout(timer);
    };
  }, []);

  // Hover handlers for the PC monitor screen
  const handleMouseMove = (e) => {
    // Disable 3D tilt & scaling when monitor is scrolled down into Demo slot
    if (morphProgress > 0.8) {
      if (hoverState.active) {
        setHoverState({ x: 0, y: 0, active: false });
      }
      return;
    }
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;

    const rotateY = ((x - xc) / xc) * 8; // max hover rotation 8deg
    const rotateX = -((y - yc) / yc) * 8;

    setHoverState({ x: rotateX, y: rotateY, active: true });
  };

  const handleMouseLeave = () => {
    setHoverState({ x: 0, y: 0, active: false });
  };

  // Device Morph Progress (0 to 1, completes within 950px scroll for a slower, smoother visual transition)
  const morphProgress = Math.min(1, Math.max(0, scrollY / 950));

  // Device 3D rotation offsets on scroll (fades to flat/0 when morphed, adjusted for slower scroll travel)
  const scrollRotateX = Math.min(18, scrollY * 0.015) * (1 - morphProgress);
  const scrollRotateY = Math.min(28, scrollY * -0.02) * (1 - morphProgress);
  const scrollRotateZ = Math.min(8, scrollY * 0.007) * (1 - morphProgress);

  // Compute final screen transformation parameters
  const translateX = morphProgress * offsets.dx;
  const translateY = morphProgress * offsets.dy;
  const baseScale = 1 + (morphProgress * 0.22); // scales from 1.0 to 1.22
  const scale = baseScale * (hoverState.active ? 1.03 : 1);

  const combinedRotateX = scrollRotateX + (hoverState.active ? hoverState.x : 0);
  const combinedRotateY = scrollRotateY + (hoverState.active ? hoverState.y : 0);

  const morphStyle = {
    transform: `perspective(1200px) translate3d(${translateX}px, ${translateY}px, 0px) rotateX(${combinedRotateX}deg) rotateY(${combinedRotateY}deg) rotateZ(${scrollRotateZ}deg) scale3d(${scale}, ${scale}, 1)`,
    transition: hoverState.active 
      ? "transform 0.08s ease-out" 
      : "transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)",
    transformStyle: "preserve-3d"
  };

  // Cross-fade opacity between the RAG Admin Visualizer and the E-commerce storefront
  const visOpacity = Math.max(0, Math.min(1, 1 - (morphProgress - 0.2) * 2.5));
  const shopOpacity = Math.max(0, Math.min(1, (morphProgress - 0.2) * 2.5));

  // Features and Simulator section progress hooks
  const [featuresRef, featuresProgress] = useScrollProgress();

  // Cards hooks (Adjusted for 3 cards grid)
  const card1 = use3DTiltAndScrollCard(12);
  const card2 = use3DTiltAndScrollCard(12);
  const card4 = use3DTiltAndScrollCard(12);

  // 3D Card Animation Styles based on Features Section progress
  const cardProgress = Math.max(0, Math.min(1, (featuresProgress - 0.15) * 3));

  const card1Style = {
    transform: `perspective(1000px) translate3d(${(1 - cardProgress) * -120}px, ${(1 - cardProgress) * 40}px, ${(1 - cardProgress) * -150}px) rotateY(${(1 - cardProgress) * 20 + (card1.hoverActive ? card1.hoverY : 0)}deg) rotateX(${card1.hoverActive ? card1.hoverX : 0}deg) scale3d(${card1.hoverActive ? 1.03 : 1}, ${card1.hoverActive ? 1.03 : 1}, 1)`,
    opacity: cardProgress,
    transition: card1.hoverActive 
      ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)" 
      : "transform 0.5s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.5s ease-out",
    transformStyle: "preserve-3d"
  };

  const card2Style = {
    transform: `perspective(1000px) translate3d(0px, ${(1 - cardProgress) * 60}px, ${(1 - cardProgress) * -100}px) rotateY(${card2.hoverActive ? card2.hoverY : 0}deg) rotateX(${(1 - cardProgress) * 15 + (card2.hoverActive ? card2.hoverX : 0)}deg) scale3d(${card2.hoverActive ? 1.03 : 1}, ${card2.hoverActive ? 1.03 : 1}, 1)`,
    opacity: cardProgress,
    transition: card2.hoverActive 
      ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)" 
      : "transform 0.55s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.55s ease-out",
    transformStyle: "preserve-3d"
  };

  const card4Style = {
    transform: `perspective(1000px) translate3d(${(1 - cardProgress) * 120}px, ${(1 - cardProgress) * 40}px, ${(1 - cardProgress) * -150}px) rotateY(${(1 - cardProgress) * -20 + (card4.hoverActive ? card4.hoverY : 0)}deg) rotateX(${card4.hoverActive ? card4.hoverX : 0}deg) scale3d(${card4.hoverActive ? 1.03 : 1}, ${card4.hoverActive ? 1.03 : 1}, 1)`,
    opacity: cardProgress,
    transition: card4.hoverActive 
      ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)" 
      : "transform 0.65s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.65s ease-out",
    transformStyle: "preserve-3d"
  };

  // 3D Heading reveal style (features section)
  const headingT = Math.max(0, Math.min(1, (featuresProgress - 0.12) * 4));
  const headingRotateX = -90 + (headingT * 90);
  const headingOpacity = headingT;
  const headingStyle = {
    transform: `perspective(800px) rotateX(${headingRotateX}deg)`,
    opacity: headingOpacity,
    transformOrigin: "top center",
    transition: "transform 0.5s cubic-bezier(0.15, 0.85, 0.2, 1), opacity 0.5s ease-out"
  };

  // Background floating shapes (3D glassmorphic parallax styling)
  const sphereStyle = {
    transform: `translate3d(0px, ${scrollY * 0.18}px, 0px) rotate(${scrollY * 0.04}deg)`,
    transition: "transform 0.1s cubic-bezier(0.1, 0.8, 0.2, 1)"
  };

  const torusStyle = {
    transform: `translate3d(0px, ${scrollY * -0.22}px, 0px) rotate(${scrollY * -0.06}deg)`,
    transition: "transform 0.1s cubic-bezier(0.1, 0.8, 0.2, 1)"
  };

  const prismStyle = {
    transform: `translate3d(0px, ${scrollY * 0.08}px, 0px) rotateX(${35 + scrollY * 0.03}deg) rotateY(${-25 + scrollY * 0.02}deg)`,
    transition: "transform 0.12s cubic-bezier(0.1, 0.8, 0.2, 1)"
  };

  // ── Interactive Conversational Voice Demo State Engine ──
  const [demoStatus, setDemoStatus] = useState('idle'); // idle | running | finished
  const [demoStep, setDemoStep] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState(null); // null | 'keyboard' | 'keycaps'
  const [chatMessages, setChatMessages] = useState([]);
  const [typingText, setTypingText] = useState('');


  // Voice speaker playback with callback
  const speakText = (text, onEnd) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel(); // kill ongoing voices
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.08;

    // Use clean natural en-US voice if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Natural')));
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  };

  // Simulated keyboard typing animation
  const simulateTyping = (text, onComplete) => {
    let current = '';
    let idx = 0;
    setTypingText('');
    
    const interval = setInterval(() => {
      current += text.charAt(idx);
      setTypingText(current);
      idx++;
      if (idx >= text.length) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 35);
  };

  // Automated step-by-step orchestrator
  const runDemoStep = (step) => {
    setDemoStep(step);
    
    if (step === 1) {
      // Step 1: User types question 1
      simulateTyping("Hey Voxa, tell me about this website. What is it about?", () => {
        setChatMessages(prev => [...prev, { sender: 'user', text: "Hey Voxa, tell me about this website. What is it about?" }]);
        setTypingText('');
        runDemoStep(2);
      });
    } 
    else if (step === 2) {
      // Step 2: Agent speaks answer 1
      const reply = "Welcome to Voxa Shop! We offer premium mechanical keyboards and workspace ergonomics. Let me highlight our flagship CyberBoard Pro keyboard for you!";
      setChatMessages(prev => [...prev, { sender: 'agent', text: reply }]);
      setActiveHighlight('keyboard');
      
      speakText(reply, () => {
        setTimeout(() => {
          runDemoStep(3);
        }, 1200);
      });
    }
    else if (step === 3) {
      // Step 3: User types question 2
      simulateTyping("Awesome! Do you have any custom keycaps?", () => {
        setChatMessages(prev => [...prev, { sender: 'user', text: "Awesome! Do you have any custom keycaps?" }]);
        setTypingText('');
        runDemoStep(4);
      });
    }
    else if (step === 4) {
      // Step 4: Agent speaks answer 2
      const reply = "Yes, we do! Here is our popular Neon Keycaps Set, perfect for adding a vibrant aesthetic to your desktop setup.";
      setChatMessages(prev => [...prev, { sender: 'agent', text: reply }]);
      setActiveHighlight('keycaps');
      
      speakText(reply, () => {
        setTimeout(() => {
          runDemoStep(5);
        }, 1200);
      });
    }
    else if (step === 5) {
      // Step 5: User types comment
      simulateTyping("Thank you, that looks great.", () => {
        setChatMessages(prev => [...prev, { sender: 'user', text: "Thank you, that looks great." }]);
        setTypingText('');
        runDemoStep(6);
      });
    }
    else if (step === 6) {
      // Step 6: Agent speaks final greeting
      const reply = "You're welcome! Let me know if you would like me to add it to your cart or if you have any other questions.";
      setChatMessages(prev => [...prev, { sender: 'agent', text: reply }]);
      setActiveHighlight(null);
      
      speakText(reply, () => {
        setTimeout(() => {
          setDemoStatus('finished');
        }, 1000);
      });
    }
  };

  const startVoiceDemo = () => {
    if (demoStatus !== 'idle') return;
    setDemoStatus('running');
    runDemoStep(1);
  };

  const stopVoiceDemo = () => {
    setDemoStatus('idle');
    setDemoStep(0);
    setActiveHighlight(null);
    setChatMessages([]);
    setTypingText('');
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const resetVoiceDemo = () => {
    stopVoiceDemo();
  };

  // Clean voices on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to get active text for the console footer inside the screen
  const getConsoleLogs = () => {
    if (demoStatus === 'idle') {
      return {
        line1: "> System idle... Awaiting console conduit connection",
        line2: "Voxa: \"Welcome! Ready to guide your site visitors.\""
      };
    }
    if (demoStatus === 'finished') {
      return {
        line1: "> Simulation finished. Speech Conduit Closed.",
        line2: "Voxa: \"Thank you for testing the live demo! Click Reset to restart.\""
      };
    }
    
    // During running steps
    if (demoStep === 1) {
      return {
        line1: `> User Input: "${typingText}"`,
        line2: "Voxa: [Awaiting Input...]"
      };
    }
    if (demoStep === 2) {
      return {
        line1: "> User Input: \"Hey Voxa, tell me about this website. What is it about?\"",
        line2: "Voxa: \"Welcome to Voxa Shop! We offer premium keyboards...\""
      };
    }
    if (demoStep === 3) {
      return {
        line1: `> User Input: "${typingText}"`,
        line2: "Voxa: [Awaiting Input...]"
      };
    }
    if (demoStep === 4) {
      return {
        line1: "> User Input: \"Awesome! Do you have any custom keycaps?\"",
        line2: "Voxa: \"Yes, we do! Here is our popular Neon Keycaps Set...\""
      };
    }
    if (demoStep === 5) {
      return {
        line1: `> User Input: "${typingText}"`,
        line2: "Voxa: [Awaiting Input...]"
      };
    }
    if (demoStep === 6) {
      return {
        line1: "> User Input: \"Thank you, that looks great.\"",
        line2: "Voxa: \"You're welcome! Let me know if you would like me to add it...\""
      };
    }
    return {
      line1: "> Searching index... found match \"Reservations\"",
      line2: "Voxa: \"Certainly! Loading the catalog layout now...\""
    };
  };

  const consoleLogs = getConsoleLogs();

  return (
    <div className='min-h-screen bg-[#070913] text-slate-100 overflow-x-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200'>
      
      {/* ── 3D Particles/Glow Background Layer ──────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full h-[3200px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 blur-[130px]" />
        <div className="absolute top-[50%] left-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-fuchsia-600/10 to-pink-600/5 blur-[160px]" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* ── 3D Glassmorphic Floating Shape Elements ───────────────────────── */}
        {/* Glowing glass sphere */}
        <div 
          style={sphereStyle}
          className="absolute top-[15%] left-[5%] w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/5 to-transparent border border-white/20 backdrop-blur-md shadow-[inset_-10px_-10px_25px_rgba(255,255,255,0.06),10px_10px_35px_rgba(0,0,0,0.4)] pointer-events-none z-0"
        />



        {/* Floating Ring/Torus shape */}
        <div 
          style={torusStyle}
          className="absolute top-[55%] left-[12%] w-28 h-28 rounded-full border-[18px] border-white/10 bg-transparent backdrop-blur-sm shadow-[inset_0_0_15px_rgba(255,255,255,0.08),5px_5px_20px_rgba(0,0,0,0.3)] pointer-events-none z-0"
        />
      </div>

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className='relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 flex flex-col lg:flex-row items-center gap-16 min-h-[90vh]'>
        
        {/* Left Side text */}
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-wide bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Version 2.0 Live — Intelligent RAG Enabled
            </span>
          </div>

          <h1 className="text-[44px] leading-[54px] sm:text-6xl sm:leading-[72px] lg:text-7xl lg:leading-[84px] font-black tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Conversational <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-emerald-400">
              Voice AI
            </span> <br />
            For Modern Sites.
          </h1>

          <p className="mt-8 text-base sm:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl">
            Give visitors an amazing, interactive voice concierge. Train it on your business knowledge document in seconds and let it guide users across your site in real time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => navigate("/builder")} 
              className="w-full sm:w-auto px-8 py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white font-bold text-base shadow-[0_0_40px_rgba(147,51,234,0.35)] hover:shadow-[0_0_60px_rgba(147,51,234,0.55)] transform hover:scale-[1.03] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Building Free <FiArrowRight size={18} />
            </button>
            <a 
              href="#live-voice-demo"
              className="w-full sm:w-auto px-8 py-4.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 text-slate-200 font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Watch Demo
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg border-t border-white/5 pt-10">
            <div>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">24/7</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Active Support</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">&lt; 1s</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Latency response</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">100%</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">No-Code Ingestion</p>
            </div>
          </div>
        </div>

        {/* Right Side - Bounding box holding the morph screen placeholder */}
        <div ref={heroScreenTargetRef} className="flex-1 w-full flex justify-center items-center h-[218px] sm:h-[338px] lg:h-[400px] relative z-40 -mt-8 sm:-mt-14 lg:-mt-20 transform translate-x-4 sm:translate-x-10 -translate-y-4 sm:-translate-y-10">
          
          {/* Morphing monitor screen itself (sits here at top scroll, translates down on scroll) */}
          <div 
            style={morphStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="absolute flex flex-col items-center select-none cursor-pointer"
          >
            {/* Monitor Screen Frame (Upsized and Styled) */}
            <div className="relative w-[340px] h-[218px] sm:w-[540px] sm:h-[338px] lg:w-[640px] lg:h-[400px] rounded-3xl p-3 bg-[#0c0f24] border-[4px] border-white/20 shadow-[0_45px_120px_rgba(0,0,0,0.9),inset_0_2px_20px_rgba(255,255,255,0.08)] overflow-hidden">
              {/* Sheen sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-transparent to-white/[0.04] pointer-events-none z-10" />
              
              {/* Inner Screen Panel */}
              <div className="relative w-full h-full rounded-2xl bg-[#05060b] overflow-hidden border border-white/5">
                
                {/* ── Layer 1: RAG Admin Visualizer Dashboard (Visible at Top) ── */}
                <div 
                  style={{ opacity: visOpacity, pointerEvents: visOpacity < 0.2 ? 'none' : 'auto' }}
                  className="absolute inset-0 flex flex-col justify-between transition-opacity duration-300 z-10"
                >
                  {/* Browser Header Bar */}
                  <div className="bg-[#0b0d1e] border-b border-white/5 px-4 py-2 flex items-center justify-between">
                    {/* Window Controls */}
                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-sm" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-sm" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-sm" />
                    </div>

                    {/* Browser Tabs */}
                    <div className="hidden sm:flex gap-1 items-end -mb-2 ml-4">
                      <div className="bg-[#05060b] border-t border-x border-white/10 text-white rounded-t-lg px-4 py-1.5 text-[9px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        voxa-concierge
                      </div>
                      <div className="text-slate-500 px-3 py-1.5 text-[9px] font-medium">
                        system-logs
                      </div>
                    </div>

                    {/* Address Bar */}
                    <div className="flex-1 max-w-[200px] sm:max-w-[240px] mx-4 py-1 px-3 rounded-md bg-black/40 border border-white/5 text-[9px] text-slate-400 truncate text-center font-mono">
                      https://voxa.ai/agent/dashboard
                    </div>

                    {/* Live Status Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                      Online
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="flex-1 flex gap-6 p-5 overflow-hidden">
                    
                    {/* Left Column: Stats Panel */}
                    <div className="hidden sm:flex flex-col gap-4 w-1/3 border-r border-white/5 pr-5 text-left justify-center">
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                        <p className="text-[8px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1"><FiLayers size={10} className="text-purple-400" /> RAG Database</p>
                        <p className="text-xs text-white font-semibold mt-1 truncate">restaurant-faq.pdf</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                        <p className="text-[8px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1"><FiCpu size={10} className="text-emerald-400" /> AI Engine</p>
                        <p className="text-xs text-emerald-400 font-semibold mt-1">Voxa-Pro-v2.0</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                        <p className="text-[8px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1"><FiActivity size={10} className="text-indigo-400" /> Avg Latency</p>
                        <p className="text-xs text-purple-400 font-bold mt-1">~340 ms</p>
                      </div>
                    </div>

                    {/* Center Column: Core Voice Visualizer orbits */}
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 relative">
                      <div className="relative flex items-center justify-center w-36 h-36">
                        <div className="absolute w-32 h-32 rounded-full border border-dashed border-purple-500/20 animate-[spin_12s_linear_infinite]" />
                        <div className="absolute w-28 h-28 rounded-full border border-purple-500/10 animate-[ping_2.5s_ease-in-out_infinite]" />
                        <div className="absolute inset-2 bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-emerald-400/5 rounded-full blur-md opacity-70" />
                        
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center border border-white/10 shadow-[0_0_35px_rgba(168,85,247,0.35)] z-10">
                          <FiMic size={28} className="text-white" />
                        </div>
                      </div>
                      
                      <div className="text-center z-10">
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">Voxa AI Agent</h3>
                        <p className="text-[8px] sm:text-[9px] text-emerald-400 font-semibold uppercase tracking-widest mt-1 animate-pulse">Listening live...</p>
                      </div>

                      <div className="flex items-end gap-1.5 h-7 z-10">
                        <span className="w-1 h-3.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-1 h-6 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="w-1 h-4.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1 h-6.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.35s' }} />
                      </div>
                    </div>
                  </div>

                  {/* Terminal Console Footer */}
                  <div className="z-20 bg-[#070914] border-t border-white/5 px-5 py-3 font-mono text-left">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                      <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider"><FiTerminal size={10} className="text-purple-400" /> CONSOLE FEED</span>
                      <span className="text-emerald-400 font-semibold uppercase">Confidence: 99%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed space-y-0.5">
                      <p className="text-purple-400/80 truncate">&gt; Searching index... found match "Reservations / Celebration"</p>
                      <p className="text-slate-100 truncate italic">Voxa: "Certainly! Opening the reservation page and displaying birthday packages now..."</p>
                    </div>
                  </div>
                </div>

                {/* ── Layer 2: E-commerce Storefront View (Visible at Bottom) ── */}
                <div 
                  style={{ opacity: shopOpacity, pointerEvents: shopOpacity < 0.2 ? 'none' : 'auto' }}
                  className="absolute inset-0 bg-[#070914] flex flex-col justify-between transition-opacity duration-300 z-20"
                >
                  {/* Storefront Header */}
                  <div className="bg-[#0c0f22] border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
                    <span className="font-black text-[11px] text-white tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      VOXA SHOP
                    </span>
                    <div className="flex gap-4 text-[9px] font-bold text-slate-400">
                      <span className="text-white">Store</span>
                      <span>Catalog</span>
                      <span>Support</span>
                    </div>
                    <div className="relative p-1 rounded-md bg-white/[0.04] text-slate-300">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-600 text-[8px] font-bold text-white flex items-center justify-center">1</span>
                    </div>
                  </div>

                  {/* Products Grid body */}
                  <div className="flex-1 p-4 flex flex-col justify-center text-left">
                    <div className="mb-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Premium Desktop Gear</h4>
                      <p className="text-[8px] text-slate-400 mt-0.5">Explore our flagship mechanical products.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Product 1: Keyboard */}
                      <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[120px] ${
                        activeHighlight === 'keyboard'
                          ? 'bg-purple-500/10 border-purple-500 scale-[1.05] shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                          : 'bg-white/[0.01] border-white/5'
                      }`}>
                        <div className="h-12 rounded bg-white/[0.02] flex items-center justify-center">
                          <svg className="w-7 h-7 text-purple-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="12" width="42" height="24" rx="3" />
                            <rect x="7" y="16" width="3" height="3" rx="0.5" />
                            <rect x="12" y="16" width="3" height="3" rx="0.5" />
                            <rect x="17" y="16" width="3" height="3" rx="0.5" />
                            <rect x="22" y="16" width="3" height="3" rx="0.5" />
                            <rect x="27" y="16" width="3" height="3" rx="0.5" />
                            <rect x="32" y="16" width="3" height="3" rx="0.5" />
                            <rect x="37" y="16" width="4" height="3" rx="0.5" />
                            <rect x="7" y="21" width="4" height="3" rx="0.5" />
                            <rect x="13" y="21" width="3" height="3" rx="0.5" />
                            <rect x="18" y="21" width="3" height="3" rx="0.5" />
                            <rect x="23" y="21" width="3" height="3" rx="0.5" />
                            <rect x="28" y="21" width="3" height="3" rx="0.5" />
                            <rect x="33" y="21" width="8" height="3" rx="0.5" fill="currentColor" fillOpacity="0.2" />
                            <rect x="7" y="26" width="5" height="3" rx="0.5" />
                            <rect x="14" y="26" width="18" height="3" rx="1" fill="currentColor" fillOpacity="0.3" />
                            <rect x="34" y="26" width="7" height="3" rx="0.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-white truncate">CyberBoard Pro</p>
                          <p className="text-[8px] text-purple-400 font-extrabold mt-0.5">$189.00</p>
                        </div>
                      </div>

                      {/* Product 2: Keycaps */}
                      <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[120px] ${
                        activeHighlight === 'keycaps'
                          ? 'bg-emerald-500/10 border-emerald-500 scale-[1.05] shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-white/[0.01] border-white/5'
                      }`}>
                        <div className="h-12 rounded bg-white/[0.02] flex items-center justify-center">
                          <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 34 L12 16 L26 16 L20 34 Z" fill="currentColor" fillOpacity="0.2" />
                            <path d="M6 34 L20 34 L20 38 L6 38 Z" fill="currentColor" fillOpacity="0.1" />
                            <path d="M12 16 L26 16 L26 20 L12 20 Z" />
                            <path d="M22 34 L28 16 L42 16 L36 34 Z" fill="currentColor" fillOpacity="0.3" />
                            <path d="M22 34 L36 34 L36 38 L22 38 Z" fill="currentColor" fillOpacity="0.1" />
                            <path d="M28 16 L42 16 L42 20 L28 20 Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-white truncate">Neon Keycaps</p>
                          <p className="text-[8px] text-emerald-400 font-extrabold mt-0.5">$45.00</p>
                        </div>
                      </div>

                      {/* Product 3: Wrist Rest */}
                      <div className="p-3 rounded-xl border bg-white/[0.01] border-white/5 flex flex-col justify-between h-[120px]">
                        <div className="h-12 rounded bg-white/[0.02] flex items-center justify-center">
                          <svg className="w-8 h-6 text-slate-400" viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="6" width="40" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
                            <path d="M8 12 C 16 14, 32 10, 40 12" strokeDasharray="2 2" opacity="0.6" />
                            <path d="M8 20 C 16 22, 32 18, 40 20" strokeDasharray="2 2" opacity="0.6" />
                            <path d="M 6 10 L 16 10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-white truncate">Aero Wrist Rest</p>
                          <p className="text-[8px] text-slate-500 font-semibold mt-0.5">$35.00</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio widget floating button in mock page */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
                    {activeHighlight && (
                      <div className="bg-slate-900/90 border border-white/10 rounded-xl px-2.5 py-1 text-[8px] text-slate-200 max-w-[120px] shadow-lg animate-pulse">
                        Speaking...
                      </div>
                    )}
                    <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 border border-white/10 shadow-lg">
                      {activeHighlight && (
                        <div className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-60" />
                      )}
                      <FiMic size={14} className="text-white" />
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Stand neck */}
            <div className="w-16 h-10 bg-gradient-to-b from-[#1b1f3c] to-[#080a18] border-x border-white/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.7)]" />
            
            {/* Stand base */}
            <div className="w-48 h-3.5 bg-gradient-to-r from-[#171a36] via-[#2a3061] to-[#12152b] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10" />
          </div>
        </div>
      </section>

      {/* ── Section: Interactive 3D Device Morphing Voice Demo ──────────────── */}
      <section 
        id="live-voice-demo"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 border-t border-white/5"
      >
        {/* Section Title above grid */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-pulse">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Live Voice AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400">
              In-Browser Demo
            </span>
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed">
            Experience how Voxa AI interacts directly with a web interface, driving browser actions and speaking out loud.
          </p>
        </div>

        {/* 2-Column Layout: Left Centered Morph Monitor Screen, Right Side Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[500px]">
          
          {/* Column 1: Left Screen Placeholder (lg:col-span-7) */}
          <div className="lg:col-span-7 w-full flex justify-center items-center h-[260px] sm:h-[390px] lg:h-[450px] order-1">
            {/* Anchored Device Morphing Target */}
            <div className="relative w-[340px] h-[218px] sm:w-[540px] sm:h-[338px] lg:w-[640px] lg:h-[400px] rounded-3xl border border-white/[0.04] bg-white/[0.01] flex items-center justify-center text-slate-600 text-xs italic select-none">
              <div ref={demoScreenTargetRef} className="absolute inset-0 pointer-events-none" />
              <span>Scroll down to dock 3D screen</span>
            </div>
          </div>

          {/* Column 2: Right Controls (lg:col-span-5) */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center h-full order-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <FiActivity size={20} className="animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-white tracking-tight">Interactive Controls</h3>
            <p className="text-base text-slate-400 mt-3 leading-relaxed">
              Click start below to activate Voxa's speech loop. Watch it read the storefront layout, answer user queries, and highlight key products in real time.
            </p>

            <div className="mt-8 max-w-[280px]">
              {demoStatus === 'idle' && (
                <button
                  onClick={startVoiceDemo}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_35px_rgba(147,51,234,0.35)] hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FiMic size={14} /> Start Voice Demo
                </button>
              )}
              {demoStatus === 'running' && (
                <button
                  onClick={stopVoiceDemo}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(239,68,68,0.35)] hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Stop Demo
                </button>
              )}
              {demoStatus === 'finished' && (
                <button
                  onClick={resetVoiceDemo}
                  className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/[0.04] text-slate-300 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Reset Demo
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── Section: Features Grid (Futuristic Cyber HUD Redesign) ────────────────── */}
      <section 
        id="features"
        ref={featuresRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 border-t border-white/5 bg-[#050711]/20 overflow-hidden"
      >
        
        {/* Top Futuristic Cyan HUD Header Line */}
        <div className="w-full relative h-10 flex items-center justify-center pointer-events-none mb-16">
          <svg className="w-full h-full text-cyan-400/80 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" viewBox="0 0 1200 40" fill="none" preserveAspectRatio="none">
            <path d="M 0 10 L 400 10 L 420 30 L 780 30 L 800 10 L 1200 10" stroke="currentColor" strokeWidth="2" />
            <path d="M 0 5 L 395 5 L 415 25 L 785 25 L 805 5 L 1200 5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <path d="M 450 20 L 470 10 L 730 10 L 750 20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 500 15 L 520 5 L 680 5 L 700 15" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
            <rect x="20" y="15" width="30" height="2" fill="currentColor" />
            <rect x="60" y="15" width="10" height="2" fill="currentColor" />
            <rect x="1130" y="15" width="10" height="2" fill="currentColor" />
            <rect x="1150" y="15" width="30" height="2" fill="currentColor" />
          </svg>
        </div>

        <div style={headingStyle} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Designed for FLAWLESS Customer Experience.
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg">
            No delivery options mentioned, automated page actions, RAG synchronization, and full brand tone customization.
          </p>
        </div>

        {/* 3-Column Cyber Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          
          {/* Card 1: Intelligent RAG */}
          <div 
            {...card1.bind}
            style={card1Style}
            className="group cursor-pointer select-none"
          >
            {/* Outer Beveled Frame with gradient border */}
            <div 
              style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
              className="relative bg-gradient-to-b from-cyan-400 via-cyan-500/30 to-purple-500/20 p-[1.5px] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300"
            >
              {/* Extra Cyber Side Brackets */}
              <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <div className="absolute right-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />

              {/* Inner Dark Beveled Card */}
              <div 
                style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                className="bg-[#050712]/95 px-8 py-12 min-h-[320px] flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-[1.08] transition-transform duration-300">
                  <FiCpu size={24} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mt-6 tracking-tight">Intelligent RAG</h3>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">Connects directly to your PDF/Markdown base. High similarity searches return real-time facts with absolute zero hallucinations.</p>
                </div>
              </div>
            </div>
            {/* Sub-pill badge */}
            <div className="mt-4 flex justify-center">
              <div 
                style={{ clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)" }}
                className="bg-cyan-500/10 border border-cyan-400/40 px-5 py-1 text-[9px] font-mono tracking-widest text-cyan-400 uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                RAG.SYS
              </div>
            </div>
          </div>

          {/* Card 2: Mandatory Guardrails */}
          <div 
            {...card2.bind}
            style={card2Style}
            className="group cursor-pointer select-none"
          >
            {/* Outer Beveled Frame with gradient border */}
            <div 
              style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
              className="relative bg-gradient-to-b from-cyan-400 via-cyan-500/30 to-indigo-500/20 p-[1.5px] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300"
            >
              {/* Extra Cyber Side Brackets */}
              <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              <div className="absolute right-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />

              {/* Inner Dark Beveled Card */}
              <div 
                style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                className="bg-[#050712]/95 px-8 py-12 min-h-[320px] flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-[1.08] transition-transform duration-300">
                  <FiShield size={24} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mt-6 tracking-tight">Mandatory Guardrails</h3>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">Enforces critical business rules (e.g. Dine-In only, no home delivery) explicitly to prevent wrong customer expectations.</p>
                </div>
              </div>
            </div>
            {/* Sub-pill badge */}
            <div className="mt-4 flex justify-center">
              <div 
                style={{ clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)" }}
                className="bg-cyan-500/10 border border-cyan-400/40 px-5 py-1 text-[9px] font-mono tracking-widest text-cyan-400 uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                RULE.SYS
              </div>
            </div>
          </div>

          {/* Card 3: Flexible Persona */}
          <div 
            {...card4.bind}
            style={card4Style}
            className="group cursor-pointer select-none"
          >
            {/* Outer Beveled Frame with gradient border */}
            <div 
              style={{ clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)" }}
              className="relative bg-gradient-to-b from-cyan-400 via-cyan-500/30 to-pink-500/20 p-[1.5px] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300"
            >
              {/* Extra Cyber Side Brackets */}
              <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
              <div className="absolute right-[-2px] top-1/4 bottom-1/4 w-[2.5px] bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.8)]" />

              {/* Inner Dark Beveled Card */}
              <div 
                style={{ clipPath: "polygon(19px 0%, calc(100% - 19px) 0%, 100% 19px, 100% calc(100% - 19px), calc(100% - 19px) 100%, 19px 100%, 0% calc(100% - 19px), 0% 19px)" }}
                className="bg-[#050712]/95 px-8 py-12 min-h-[320px] flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-[1.08] transition-transform duration-300">
                  <FiSliders size={24} className="drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mt-6 tracking-tight">Flexible Persona</h3>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">Customize colors, fonts, voice styles, and assistant names directly from a visual customizer.</p>
                </div>
              </div>
            </div>
            {/* Sub-pill badge */}
            <div className="mt-4 flex justify-center">
              <div 
                style={{ clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)" }}
                className="bg-cyan-500/10 border border-cyan-400/40 px-5 py-1 text-[9px] font-mono tracking-widest text-cyan-400 uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                TONE.SYS
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Futuristic Cyan HUD Footer Line (mirrored top HUD) */}
        <div className="w-full relative h-10 flex items-center justify-center pointer-events-none mt-20 transform scale-y-[-1]">
          <svg className="w-full h-full text-cyan-400/80 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" viewBox="0 0 1200 40" fill="none" preserveAspectRatio="none">
            <path d="M 0 10 L 400 10 L 420 30 L 780 30 L 800 10 L 1200 10" stroke="currentColor" strokeWidth="2" />
            <path d="M 0 5 L 395 5 L 415 25 L 785 25 L 805 5 L 1200 5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <path d="M 450 20 L 470 10 L 730 10 L 750 20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 500 15 L 520 5 L 680 5 L 700 15" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
            <rect x="20" y="15" width="30" height="2" fill="currentColor" />
            <rect x="60" y="15" width="10" height="2" fill="currentColor" />
            <rect x="1130" y="15" width="10" height="2" fill="currentColor" />
            <rect x="1150" y="15" width="30" height="2" fill="currentColor" />
          </svg>
        </div>

      </section>


      {/* ── Footer (Futuristic Sci-Fi HUD Overhaul) ───────────────────────────── */}
      <footer className="relative z-10 bg-[#020306] border-t border-white/10 pt-20 pb-10 px-6 sm:px-12 overflow-hidden">
        
        {/* Giant Backdrop Text: VoxaAI (Watermark Style with Purple Outline) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden whitespace-nowrap">
          <span 
            className="inline-block text-[10vw] sm:text-[12vw] lg:text-[13vw] font-black tracking-tighter text-transparent [-webkit-text-stroke:1.5px_rgba(139,92,246,0.15)] leading-none"
          >
            VoxaAI
          </span>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/5">
          
          {/* Column 1: Brand Info (col-span-12 md:col-span-4) */}
          <div className="md:col-span-4 flex flex-col items-start text-left">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="logo" className="h-13 w-auto object-contain" />
              <span className="font-extrabold text-2xl tracking-wider text-white">
                Voxa<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400">AI</span>
              </span>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empower your site with a real-time conversational voice concierge. Trained on your knowledge base in seconds, guiding visitors with zero latency.
            </p>

            {/* Futuristic Tech Pill Accents */}
            <div className="mt-8 flex gap-3">
              <span className="px-3 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-[9px] font-mono text-cyan-400 tracking-wider uppercase">
                Secure SSL
              </span>
              <span className="px-3 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-[9px] font-mono text-amber-400 tracking-wider uppercase">
                Multi-Modal v2.5
              </span>
            </div>
          </div>

          {/* Column 2: Navigation Links (col-span-6 md:col-span-2) */}
          <div className="col-span-6 md:col-span-2 text-left">
            <h4 className="text-xs uppercase font-mono tracking-widest text-amber-400 border-l-2 border-amber-400 pl-3.5 mb-6">Company</h4>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a></li>
              <li><a href="/about" className="hover:text-white transition-colors duration-200">About Us</a></li>
              <li><a href="/careers" className="hover:text-white transition-colors duration-200">Careers</a></li>
            </ul>
          </div>

          {/* Column 3: Resources Links (col-span-6 md:col-span-2) */}
          <div className="col-span-6 md:col-span-2 text-left">
            <h4 className="text-xs uppercase font-mono tracking-widest text-cyan-400 border-l-2 border-cyan-400 pl-3.5 mb-6">Resources</h4>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li><a href="/docs" className="hover:text-white transition-colors duration-200">Documentation</a></li>
              <li><a href="/api" className="hover:text-white transition-colors duration-200">API Console</a></li>
              <li><a href="/status" className="hover:text-white transition-colors duration-200">System Status</a></li>
              <li><a href="/help" className="hover:text-white transition-colors duration-200">Support Desk</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter Subscriber Input Box (col-span-12 md:col-span-4) */}
          <div className="md:col-span-4 text-left flex flex-col justify-start">
            <h4 className="text-xs uppercase font-mono tracking-widest text-white border-l-2 border-white pl-3.5 mb-6">Subscribe</h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Get notified of version releases, RAG visualizer updates, and multi-modal voice feature rollouts.
            </p>
            
            {/* Beveled Subscriber input bar */}
            <form onSubmit={(e) => e.preventDefault()} className="relative flex flex-col sm:flex-row gap-3">
              <div 
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                className="flex-1 bg-gradient-to-r from-amber-400/50 via-cyan-400/30 to-indigo-500/20 p-[1px] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-shadow duration-300"
              >
                <div 
                  style={{ clipPath: "polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)" }}
                  className="bg-[#030408] w-full h-full flex items-center"
                >
                  <input 
                    type="email" 
                    placeholder="Enter system email" 
                    className="w-full px-4 py-3 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
                className="bg-gradient-to-r from-amber-500 via-yellow-500 to-cyan-500 text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 hover:scale-[1.03] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Sync
              </button>
            </form>
          </div>

        </div>

        {/* Footer Sub-bar */}
        <div className="relative z-10 max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} VoxaAI. All system nodes synchronized.</p>
          <div className="flex gap-6 font-mono">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">PRIVACY_POLICY.md</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">TERMS_OF_SERVICE.md</a>
          </div>
        </div>

      </footer>
    </div>
  )
}

export default Home
