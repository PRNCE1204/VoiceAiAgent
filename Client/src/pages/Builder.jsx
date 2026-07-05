import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react'
import {
  FiCopy, FiTrash2, FiUploadCloud, FiFileText,
  FiLoader, FiRefreshCw, FiExternalLink, FiEdit3,
  FiCheck, FiZap, FiBox, FiSun, FiMoon, FiDroplet,
  FiSend, FiSettings, FiVolume2, FiGrid, FiCompass,
  FiCpu, FiActivity, FiTerminal, FiRadio, FiMic
} from 'react-icons/fi';
import { HiOutlineSparkles, HiOutlineMicrophone, HiOutlineKey } from 'react-icons/hi';
import { CLIENT_URL, ServerUrl } from '../App';
import toast from 'react-hot-toast';
import logo from '../assets/logo.jpg';

const THEMES = [
  { 
    value: "light",  
    label: "Light",  
    icon: <FiSun />,      
    gradient: "from-yellow-400/20 to-orange-400/20",  
    border: "border-yellow-500/40",  
    text: "text-yellow-300",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.2)] border-yellow-500/50 text-yellow-400",
    spec: "CAL_VOLT: 3.3V // EMIT: REFRACTIVE"
  },
  { 
    value: "dark",   
    label: "Dark",   
    icon: <FiMoon />,     
    gradient: "from-slate-600/20 to-slate-800/20",    
    border: "border-slate-500/40",   
    text: "text-slate-300",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.2)] border-indigo-500/50 text-indigo-400",
    spec: "CAL_VOLT: 1.2V // EMIT: LOW_SENS"
  },
  { 
    value: "glass",  
    label: "Glass",  
    icon: <FiDroplet />,  
    gradient: "from-cyan-400/20 to-blue-400/20",      
    border: "border-cyan-500/40",    
    text: "text-cyan-300",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)] border-cyan-500/50 text-cyan-400",
    spec: "CAL_VOLT: 2.8V // TRANSLUCENCY: 85%"
  },
  { 
    value: "neon",   
    label: "Neon",   
    icon: <FiZap />,      
    gradient: "from-purple-400/20 to-pink-400/20",    
    border: "border-purple-500/40",  
    text: "text-purple-300",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.2)] border-pink-500/50 text-pink-400",
    spec: "CAL_VOLT: 5.0V // EMIT: PHOTONIC"
  },
];

const TONES = [
  { 
    value: "friendly",     
    label: "Friendly",     
    desc: "Warm & approachable",
    icon: <FiVolume2 className="text-emerald-400" />,
    metrics: "ENTROPY: LOW // PROSODY: WARM"
  },
  { 
    value: "professional", 
    label: "Professional", 
    desc: "Formal & precise",
    icon: <FiCpu className="text-blue-400" />,
    metrics: "ENTROPY: MIN // PROSODY: STEADY"
  },
  { 
    value: "sales",        
    label: "Sales",        
    desc: "Persuasive & driven",
    icon: <HiOutlineSparkles className="text-purple-400" />,
    metrics: "ENTROPY: MID // PROSODY: DYNAMIC"
  },
];

// Styled container card with Robotic HUD details
const Section = ({ title, subtitle, action, children, darkMode, nodeLabel }) => {
  const cardStyle = darkMode
    ? { clipPath: "polygon(16px 0%, calc(100% - 16px) 0%, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0% calc(100% - 16px), 0% 16px)" }
    : { borderRadius: "16px" };

  const bgClass = darkMode
    ? "bg-[#0c0f22]/90 border border-purple-500/10 backdrop-blur-md relative"
    : "bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative";

  const titleClass = darkMode ? "text-white font-mono" : "text-slate-800 font-extrabold";
  const subClass = darkMode ? "text-slate-500" : "text-slate-400";

  return (
    <div style={cardStyle} className={`p-6 lg:p-8 transition-all ${bgClass}`}>
      {/* HUD Corner Tech Accents (Dark Mode Only) */}
      {darkMode && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-500/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-500/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-500/40" />
          {nodeLabel && (
            <div className="absolute top-2 right-4 text-[8px] font-mono text-purple-400/50 uppercase tracking-widest">
              {nodeLabel}
            </div>
          )}
        </>
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className={`font-bold text-lg ${titleClass}`}>{title}</h2>
          {subtitle && <p className={`text-sm mt-1 ${subClass}`}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

// Styled Input for Dark/Light modes
const ModeInput = ({ placeholder, value, onChange, type = "text", rows, darkMode }) => {
  const base = darkMode
    ? "w-full bg-[#050812] border border-white/10 text-white placeholder:text-slate-600 text-sm px-4 focus:outline-none focus:border-purple-500/50 focus:bg-[#070b1a] transition-all rounded-xl font-mono"
    : "w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm px-4 focus:outline-none focus:border-purple-500/50 focus:bg-white transition-all rounded-xl";
  return rows
    ? <textarea rows={rows} placeholder={placeholder} value={value} onChange={onChange} className={`${base} py-3 resize-none`} />
    : <input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`${base} h-12`} />;
};

function Builder({ user, setUser, darkMode }) {
  const [editAssistant, setEditAssistant] = useState(!user?.isSetupComplete);
  const [assistantName, setAssistantName] = useState(user?.assistantName || "");
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [businessType, setBusinessType] = useState(user?.businessType || "");
  const [businessDescription, setBusinessDescription] = useState(user?.businessDescription || "");
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [tone, setTone] = useState(user?.tone || "friendly");
  const [geminiApiKey, setGeminiApiKey] = useState(user?.geminiApiKey || "");
  const [assistantAvatar, setAssistantAvatar] = useState(user?.assistantAvatar || "");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [scrapeUrlInput, setScrapeUrlInput] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [processingDocs, setProcessingDocs] = useState(new Set());
  const [reprocessingDoc, setReprocessingDoc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [mockWidgetOpen, setMockWidgetOpen] = useState(true);

  // Advanced configurations options
  const [voiceGender, setVoiceGender] = useState(user?.voiceGender || 'female');
  const [widgetPlacement, setWidgetPlacement] = useState(user?.widgetPlacement || 'right');
  const [welcomeGreeting, setWelcomeGreeting] = useState(user?.welcomeGreeting || "Hi! I'm your AI voice assistant. How can I help you today?");

  // Interactive Live Playground State
  const [playgroundMsgs, setPlaygroundMsgs] = useState([
    { sender: 'assistant', text: "Speech Conduit Active. System calibrated to voice frequency. Send a test query to verify my responses." }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [sendingPlayground, setSendingPlayground] = useState(false);
  const [isRecordingSandbox, setIsRecordingSandbox] = useState(false);
  const playgroundEndRef = useRef(null);

  const embedCode = `<script src="${CLIENT_URL}/assistant.js" data-user-id="${user?._id}"></script>`;

  const remainingMessages = Math.max(0, (user?.requestLimit || 0) - (user?.totalMessages || 0));
  const remainingDays = user?.proExpiresAt
    ? Math.max(0, Math.ceil((new Date(user.proExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if (user?.isSetupComplete && !editAssistant) {
      fetchDocuments();
      fetchConversations();
    }
  }, [user, editAssistant]);

  // Scroll to bottom of playground logs
  useEffect(() => {
    playgroundEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [playgroundMsgs]);

  // Poll processing status
  useEffect(() => {
    if (processingDocs.size === 0) return;
    const interval = setInterval(async () => {
      let anyStillProcessing = false;
      const updatedDocs = [...documents];
      let changed = false;
      for (const docId of processingDocs) {
        try {
          const res = await axios.get(ServerUrl + `/api/user/document/${docId}/status`, { withCredentials: true });
          const { status, chunkCount } = res.data;
          const idx = updatedDocs.findIndex(d => d._id === docId);
          if (idx !== -1 && (updatedDocs[idx].status !== status || updatedDocs[idx].chunkCount !== chunkCount)) {
            updatedDocs[idx] = { ...updatedDocs[idx], status, chunkCount };
            changed = true;
          }
          if (status === 'pending' || status === 'processing') anyStillProcessing = true;
        } catch (err) { console.warn('Status poll failed for', docId); }
      }
      if (changed) setDocuments(updatedDocs);
      if (!anyStillProcessing) { setProcessingDocs(new Set()); clearInterval(interval); }
    }, 3000);
    return () => clearInterval(interval);
  }, [processingDocs, documents]);

  const fetchConversations = async () => {
    try { const res = await axios.get(ServerUrl + "/api/user/conversations", { withCredentials: true }); setConversations(res.data); }
    catch (e) { console.error("Failed to fetch conversations:", e); }
  };

  const fetchDocuments = async () => {
    try { const res = await axios.get(ServerUrl + "/api/user/documents", { withCredentials: true }); setDocuments(res.data); }
    catch (e) { console.error("Failed to fetch documents:", e); }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const SUPPORTED = ["pdf", "txt", "docx", "md"];
    if (!SUPPORTED.includes(ext)) { toast.error(`Unsupported file. Supported: ${SUPPORTED.join(", ")}`); return; }
    const formData = new FormData();
    formData.append("file", file);
    setUploadingDoc(true);
    try {
      const res = await axios.post(ServerUrl + "/api/user/document/upload", formData, { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
      toast.success("Document uploaded successfully");
      await fetchDocuments();
      if (res.data?.document?._id) setProcessingDocs(prev => new Set([...prev, res.data.document._id]));
    } catch (e) { toast.error(e.response?.data?.message || "Upload failed"); }
    finally { setUploadingDoc(false); }
  };

  const handleDrop = async (e) => { e.preventDefault(); setIsDragging(false); await uploadFile(e.dataTransfer.files[0]); };
  const handleFileUpload = async (e) => { await uploadFile(e.target.files[0]); e.target.value = null; };

  const handleScrapeUrl = async () => {
    if (!scrapeUrlInput) return;
    setScrapingUrl(true);
    try {
      const res = await axios.post(ServerUrl + "/api/user/document/scrape", { url: scrapeUrlInput }, { withCredentials: true });
      toast.success(`Website queued${res.data?.pagesCrawled ? ` (${res.data.pagesCrawled} pages)` : ''}`);
      setScrapeUrlInput("");
      await fetchDocuments();
      if (res.data?.document?._id) setProcessingDocs(prev => new Set([...prev, res.data.document._id]));
    } catch (e) { toast.error(e.response?.data?.message || "Scrape failed"); }
    finally { setScrapingUrl(false); }
  };

  const handleReprocessDocument = async (docId) => {
    setReprocessingDoc(docId);
    try {
      await axios.post(ServerUrl + `/api/user/document/${docId}/reprocess`, {}, { withCredentials: true });
      toast.success("Queued for reprocessing");
      setProcessingDocs(prev => new Set([...prev, docId]));
      setDocuments(prev => prev.map(d => d._id === docId ? { ...d, status: 'pending' } : d));
    } catch (e) { toast.error(e.response?.data?.message || "Reprocess failed"); }
    finally { setReprocessingDoc(null); }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await axios.delete(ServerUrl + `/api/user/document/${docId}`, { withCredentials: true });
      toast.success("Document deleted");
      fetchDocuments();
    } catch (e) { toast.error("Delete failed"); }
  };

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAssistantAvatar(reader.result);
      toast.success("Avatar preview updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileUpload = (e) => {
    handleAvatarFile(e.target.files[0]);
    e.target.value = null;
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    handleAvatarFile(e.dataTransfer.files[0]);
  };

  const saveAssistant = async () => {
    setLoading(true);
    try {
      const res = await axios.post(ServerUrl + "/api/user/save-assistant", { 
        assistantName, 
        businessName, 
        businessType, 
        businessDescription, 
        tone, 
        theme, 
        geminiApiKey, 
        pages: user?.pages || [], 
        assistantAvatar,
        voiceGender,
        widgetPlacement,
        welcomeGreeting
      }, { withCredentials: true });
      setUser(res.data.user);
      setEditAssistant(false);
      toast.success("Assistant saved!");
    } catch (e) { toast.error("Failed to save assistant"); }
    finally { setLoading(false); }
  };

  const saveCalibration = async () => {
    try {
      const res = await axios.post(ServerUrl + "/api/user/save-assistant", { 
        assistantName, 
        businessName, 
        businessType, 
        businessDescription, 
        tone, 
        theme, 
        geminiApiKey, 
        pages: user?.pages || [], 
        assistantAvatar,
        voiceGender,
        widgetPlacement,
        welcomeGreeting
      }, { withCredentials: true });
      setUser(res.data.user);
      toast.success("Calibration settings saved!");
    } catch (e) { 
      toast.error("Failed to save calibration settings"); 
    }
  };

  // Chat Sandbox Call to Server
  const handlePlaygroundSend = async (e) => {
    e.preventDefault();
    if (!playgroundInput.trim() || sendingPlayground) return;
    const userText = playgroundInput;
    setPlaygroundInput('');
    setPlaygroundMsgs(prev => [...prev, { sender: 'user', text: userText }]);
    setSendingPlayground(true);
    try {
      const res = await axios.post(ServerUrl + "/api/assistant/ask", {
        message: userText,
        userId: user?._id
      });
      setPlaygroundMsgs(prev => [...prev, { 
        sender: 'assistant', 
        text: res.data.aiResponse || res.data.reply || "No response received.",
        sources: res.data.sources || []
      }]);
    } catch (err) {
      setPlaygroundMsgs(prev => [...prev, { sender: 'assistant', text: "Error: Make sure your Gemini API key is active." }]);
    } finally {
      setSendingPlayground(false);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      toast.error("Browser text-to-speech not supported");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    let voice = null;
    if (voiceGender === 'male') {
      voice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('google us english'));
      utterance.pitch = 0.85;
    } else {
      voice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('google uk english female') || v.name.toLowerCase().includes('google us english'));
      utterance.pitch = 1.15;
    }
    if (voice) utterance.voice = voice;
    
    window.speechSynthesis.speak(utterance);
    toast.success("Speaking response...");
  };

  const startSandboxVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Web Speech API is not supported in this browser");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    
    rec.onstart = () => {
      setIsRecordingSandbox(true);
      toast.success("Sandbox voice recording active. Speak now...");
    };
    
    rec.onerror = (e) => {
      setIsRecordingSandbox(false);
      if (e.error !== "no-speech") {
        toast.error(`Recording failed: ${e.error}`);
      }
    };
    
    rec.onend = () => {
      setIsRecordingSandbox(false);
    };
    
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPlaygroundInput(transcript);
    };
    
    rec.start();
  };

  const getCoreColors = () => {
    switch (theme) {
      case "light":
        return {
          ring1: "border-yellow-500/40",
          ring2: "border-orange-500/20",
          coreBg: "from-yellow-400 to-orange-500",
          coreGlow: "shadow-[0_0_35px_rgba(234,179,8,0.4)]",
          wave: "SINE_PROSODY",
        };
      case "glass":
        return {
          ring1: "border-cyan-400/40",
          ring2: "border-blue-400/20",
          coreBg: "from-cyan-400 to-blue-500",
          coreGlow: "shadow-[0_0_35px_rgba(6,182,212,0.4)]",
          wave: "TRANSLUCENT_DELTA",
        };
      case "neon":
        return {
          ring1: "border-pink-500/40",
          ring2: "border-purple-500/20",
          coreBg: "from-pink-500 to-purple-600",
          coreGlow: "shadow-[0_0_35px_rgba(236,72,153,0.45)]",
          wave: "PHOTONIC_PULSE",
        };
      case "dark":
      default:
        return {
          ring1: "border-indigo-500/40",
          ring2: "border-slate-700/30",
          coreBg: "from-indigo-600 to-slate-900",
          coreGlow: "shadow-[0_0_35px_rgba(99,102,241,0.35)]",
          wave: "SQUARE_SINE_SYNC",
        };
    }
  };
  const coreColors = getCoreColors();

  const canSave = assistantName && businessName && businessType && businessDescription && geminiApiKey;

  // Custom Chart Data Points
  const analyticPoints = [15, 28, 12, 42, 60, 48, 72, 85, 52, 94, 88, 110];

  return (
    <div className={`min-h-screen transition-all ${darkMode ? 'bg-[#070913] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Background Graphic Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {darkMode ? (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-600/8 to-indigo-600/5 blur-[160px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/6 to-cyan-500/6 blur-[140px]" />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/5 to-indigo-400/5 blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-400/5 to-cyan-400/5 blur-[120px]" />
          </>
        )}
      </div>

      <div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10'>

        {/* ── Robotic Header ────────────────────────────────────────── */}
        <div className='mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${darkMode ? 'border-purple-500/20 bg-purple-500/5 text-purple-400' : 'border-purple-100 bg-purple-50 text-purple-600'}`}>
              <FiCpu className="animate-spin text-purple-500" /> SYSTEM CONTROL INTERFACE
            </div>
            <h1 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white font-mono' : 'text-slate-900'}`}>
              {user.isSetupComplete 
                ? <>VOICE<span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-emerald-400 font-sans'> CONDUIT DECK</span></>
                : <>ASSISTANT<span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-emerald-400 font-sans'> GENESIS CHAMBER</span></>
              }
            </h1>
            <p className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} mt-2 text-xs font-mono`}>
              {user.isSetupComplete 
                ? `DEVICE_ADDR: ${user?._id || 'N/A'} // RAG_AGENT_STATUS: ONLINE`
                : `DEVICE_ADDR: ${user?._id || 'N/A'} // PROTOTYPE_NODE: OFFLINE // SECURE_INIT_PENDING`
              }
            </p>
          </div>

          {user.isSetupComplete && (
            <button 
              onClick={() => setEditAssistant(!editAssistant)}
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
              className={`flex items-center justify-center gap-2 px-6 h-12 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all border-none ${editAssistant ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'}`}
            >
              {editAssistant ? <FiCheck /> : <FiEdit3 />}
              {editAssistant ? "DEPLOY MODEL" : "TUNE SYSTEM"}
            </button>
          )}
        </div>

        {/* ── Robotic Diagnostic status conduit (Dark Mode Only) ── */}
        {darkMode && user.isSetupComplete && !editAssistant && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 bg-[#0c0f22]/50 border border-purple-500/10 rounded-xl p-3 text-[10px] font-mono text-slate-500">
            <div><span className="text-purple-400">// CORE_SYS:</span> ACTIVE</div>
            <div><span className="text-purple-400">// VOICE_DECODER:</span> PCM_16K</div>
            <div><span className="text-purple-400">// LATENCY:</span> 42ms</div>
            <div><span className="text-purple-400">// RAG_INDEX:</span> SYNCED</div>
            <div className="col-span-2 md:col-span-1"><span className="text-purple-400">// MODEL:</span> GEMINI_3.5_FLASH</div>
          </div>
        )}

        {/* ── DASHBOARD CONTROL DECK VIEW ── */}
        {user.isSetupComplete && !editAssistant && (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
            
            {/* Left and Mid Grid Side */}
            <div className='lg:col-span-2 space-y-6'>
              
              {/* Analytics Graph & Stats */}
              <Section 
                darkMode={darkMode}
                nodeLabel="NODE_ANALYTICS_01"
                title="Conduit Flow Telemetry" 
                subtitle="Interaction sync metrics captured across verified web nodes"
              >
                {/* SVG Live Custom Graphic Curve Chart */}
                <div className='h-48 w-full relative mb-6 rounded-xl overflow-hidden bg-black/20 border border-white/[0.04] p-4 flex flex-col justify-end'>
                  <div className='absolute inset-0 flex flex-col justify-between p-3 opacity-20 text-[8px] font-mono pointer-events-none'>
                    <div>120 REQ</div>
                    <div>80 REQ</div>
                    <div>40 REQ</div>
                    <div>0 REQ</div>
                  </div>
                  
                  {/* Curve drawing */}
                  <svg className='w-full h-32 overflow-visible' viewBox="0 0 550 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Glow fill */}
                    <path 
                      d={`M 0 120 L 0 ${120 - analyticPoints[0]} L 50 ${120 - analyticPoints[1]} L 100 ${120 - analyticPoints[2]} L 150 ${120 - analyticPoints[3]} L 200 ${120 - analyticPoints[4]} L 250 ${120 - analyticPoints[5]} L 300 ${120 - analyticPoints[6]} L 350 ${120 - analyticPoints[7]} L 400 ${120 - analyticPoints[8]} L 450 ${120 - analyticPoints[9]} L 500 ${120 - analyticPoints[10]} L 550 ${120 - analyticPoints[11]} L 550 120 Z`}
                      fill="url(#chartGlow)"
                    />
                    {/* Curve line */}
                    <path 
                      d={`M 0 ${120 - analyticPoints[0]} Q 25 ${120 - (analyticPoints[0]+analyticPoints[1])/2} 50 ${120 - analyticPoints[1]} T 100 ${120 - analyticPoints[2]} T 150 ${120 - analyticPoints[3]} T 200 ${120 - analyticPoints[4]} T 250 ${120 - analyticPoints[5]} T 300 ${120 - analyticPoints[6]} T 350 ${120 - analyticPoints[7]} T 400 ${120 - analyticPoints[8]} T 450 ${120 - analyticPoints[9]} T 500 ${120 - analyticPoints[10]} T 550 ${120 - analyticPoints[11]}`}
                      fill="none"
                      stroke="url(#chartLineGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </svg>
                  
                  {/* X Axis label grid */}
                  <div className='flex justify-between mt-2 pt-2 border-t border-white/5 text-[8px] text-slate-500 font-mono'>
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-3.5'>
                  {/* Plan info */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-white/[0.02] border-white/[0.06] text-left' : 'bg-slate-50 border-slate-100 text-left'}`}>
                    <p className='text-[8px] uppercase font-mono tracking-wider text-slate-500 mb-1'>Sync Tier</p>
                    <p className={`text-sm font-black capitalize ${darkMode ? 'text-white font-mono' : 'text-slate-800'}`}>{user?.plan}</p>
                  </div>
                  {/* API status */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-white/[0.02] border-white/[0.06] text-left' : 'bg-slate-50 border-slate-100 text-left'}`}>
                    <p className='text-[8px] uppercase font-mono tracking-wider text-slate-500 mb-1'>Conduit Status</p>
                    <p className={`text-sm font-black capitalize font-mono ${user?.geminiStatus === "active" ? "text-emerald-400" : "text-red-400"}`}>
                      {user?.geminiStatus}
                    </p>
                  </div>
                  {/* Limit status */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-white/[0.02] border-white/[0.06] text-left' : 'bg-slate-50 border-slate-100 text-left'}`}>
                    <p className='text-[8px] uppercase font-mono tracking-wider text-slate-500 mb-1'>Queries Left</p>
                    <p className={`text-sm font-black ${darkMode ? 'text-white font-mono' : 'text-slate-800'}`}>{remainingMessages}</p>
                  </div>
                </div>
              </Section>

              {/* Embedding Script */}
              <Section 
                darkMode={darkMode}
                nodeLabel="NODE_EMBED_02"
                title="Integrate Widget Script" 
                subtitle="Embed the snippet within your root layout templates"
              >
                <div className='relative'>
                  <textarea 
                    readOnly 
                    value={embedCode}
                    className={`w-full h-14 rounded-xl p-4 text-[10px] font-mono resize-none outline-none border focus:outline-none ${darkMode ? 'bg-[#050810] border-white/[0.06] text-emerald-400' : 'bg-slate-100 border-slate-200 text-purple-700'}`} 
                  />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(embedCode); toast.success("Copied!"); }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${darkMode ? 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-white hover:border-purple-500/40' : 'bg-white border-slate-200 text-slate-500 hover:text-black hover:border-slate-400'}`}
                  >
                    <FiCopy size={13} />
                  </button>
                </div>
              </Section>

              {/* Knowledge Base */}
              <Section 
                darkMode={darkMode}
                nodeLabel="NODE_VECTOR_STORE_03"
                title="Vector Ingestion Array" 
                subtitle="Feed documents and web crawls into your custom RAG context window"
              >
                {/* Upload drag block */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('kb-file-input').click()}
                  className={`mb-5 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-purple-500/60 bg-purple-500/5' : darkMode ? 'border-white/10 hover:border-purple-500/30 hover:bg-white/[0.01]' : 'border-slate-200 hover:border-purple-500/30 hover:bg-slate-50'}`}
                >
                  <input id='kb-file-input' type='file' accept='.pdf,.txt,.docx,.md' onChange={handleFileUpload} disabled={uploadingDoc} className='hidden' />
                  {uploadingDoc ? (
                    <div className="flex flex-col items-center gap-2">
                      <FiLoader className='text-3xl text-purple-400 animate-spin' />
                      <p className='text-xs text-slate-400 font-mono'>Syncing nodes...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FiUploadCloud className={`text-2xl ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      <p className='text-xs font-semibold text-slate-400 font-mono'>{isDragging ? 'RELEASE_TO_UPLOAD' : 'DRAG_OR_CLICK_TO_CHOOSE_PDF_DOCX_TXT_MD'}</p>
                    </div>
                  )}
                </div>

                {/* Scrape URL */}
                <div className='flex gap-3 mb-5'>
                  <input 
                    type='url' 
                    placeholder='https://company.com/info' 
                    value={scrapeUrlInput}
                    onChange={(e) => setScrapeUrlInput(e.target.value)}
                    className={`flex-1 h-11 border text-xs px-4 rounded-xl focus:outline-none transition-all ${darkMode ? 'bg-[#050812] border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 font-mono' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500/50'}`} 
                  />
                  <button 
                    onClick={handleScrapeUrl} 
                    disabled={scrapingUrl || !scrapeUrlInput}
                    className='h-11 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-500 text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer border-none disabled:opacity-40 font-mono'
                  >
                    {scrapingUrl ? <FiLoader className='animate-spin' /> : <FiExternalLink size={13} />}
                    {scrapingUrl ? 'SYNCHRONIZING' : 'SYNC_LINK'}
                  </button>
                </div>

                {/* Scrape Status List */}
                {documents.length === 0 ? (
                  <div className='text-center py-6 border border-dashed border-white/[0.06] rounded-xl font-mono'>
                    <p className='text-xs text-slate-500'>Empty vector store index. Add nodes to train.</p>
                  </div>
                ) : (
                  <div className='space-y-2 max-h-60 overflow-y-auto pr-1 font-mono'>
                    {documents.map((doc) => {
                      const isActive = doc.status === 'pending' || doc.status === 'processing';
                      return (
                        <div key={doc._id} className={`flex items-center justify-between border rounded-xl p-3.5 ${darkMode ? 'border-purple-500/10 bg-white/[0.01] hover:bg-white/[0.03]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                          <div className='flex items-center gap-3 min-w-0'>
                            <div className='w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0'>
                              {isActive ? <FiLoader className='animate-spin text-xs' /> : <FiFileText className='text-xs' />}
                            </div>
                            <div className='min-w-0 text-left'>
                              <p className={`text-xs font-bold truncate max-w-[200px] ${darkMode ? 'text-white' : 'text-slate-800'}`} title={doc.filename}>{doc.filename}</p>
                              <p className='text-[9px] text-slate-500 mt-0.5 capitalize'>{doc.fileType} // CHUNKS: {doc.chunkCount || 0}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2 shrink-0'>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${doc.status === 'synced' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{doc.status}</span>
                            <button onClick={() => handleDeleteDocument(doc._id)} className='p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer border-none bg-transparent'>
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </div>

            {/* Right Dashboard Column: Sandbox Playground & Advanced Settings */}
            <div className='space-y-6'>
              
              {/* Live Preview Playground */}
              <Section 
                darkMode={darkMode}
                nodeLabel="NODE_PLAYGROUND_04"
                title="Conduit Sandbox" 
                subtitle="Live telemetry validation to test prompt tuning"
              >
                {/* Visual Robotic Audio Frequency Waveform (Only Dark Mode) */}
                {darkMode && (
                  <div className="flex items-center justify-center gap-1 mb-4 h-8 bg-black/20 rounded-lg border border-purple-500/10">
                    <span className="text-[8px] font-mono text-purple-400/70 mr-2">SPEECH_FREQ:</span>
                    {[...Array(14)].map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1 rounded bg-purple-500/70 transition-all ${sendingPlayground ? 'animate-bounce' : 'h-1.5'}`} 
                        style={{ 
                          height: sendingPlayground ? undefined : `${3 + Math.random() * 15}px`,
                          animationDelay: `${idx * 0.08}s`,
                          animationDuration: '0.6s'
                        }} 
                      />
                    ))}
                  </div>
                )}

                <div className={`rounded-xl border flex flex-col h-72 ${darkMode ? 'bg-[#050810] border-purple-500/15' : 'bg-slate-50 border-slate-200'}`}>
                  {/* Messages container */}
                  <div className='flex-1 overflow-y-auto p-4 space-y-3 min-h-0 text-[11px] font-mono'>
                    {playgroundMsgs.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className='text-[8px] text-slate-500 capitalize'>{m.sender} // {m.sender === 'user' ? 'U_NODE' : 'CONDUIT'}</span>
                          {m.sender === 'assistant' && (
                            <button 
                              type="button"
                              onClick={() => speakText(m.text)} 
                              title="Speak response aloud"
                              className="p-0.5 text-slate-500 hover:text-purple-400 rounded transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center"
                            >
                              <FiVolume2 size={10} />
                            </button>
                          )}
                        </div>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${m.sender === 'user' ? 'bg-purple-600 text-white rounded-tr-none font-mono text-[10px]' : darkMode ? 'bg-white/[0.02] border border-purple-500/20 text-slate-300 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                          {m.text}
                          
                          {/* RAG Telemetry Inspector */}
                          {m.sources && m.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-left">
                              <details className="cursor-pointer group">
                                <summary className="text-purple-400/80 font-bold hover:text-purple-300 list-none flex items-center gap-1 select-none">
                                  <span>🔍 INSPECT RAG TELEMETRY</span>
                                  <span className="text-[7px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-2 space-y-1.5 bg-black/35 rounded-lg p-2 max-h-40 overflow-y-auto border border-white/[0.04] scrollbar-width-thin">
                                  {m.sources.map((src, sIdx) => (
                                    <div key={sIdx} className="pb-1.5 last:pb-0 last:border-b-0 border-b border-white/5">
                                      <div className="flex items-center justify-between text-slate-400 font-bold text-[7.5px] uppercase tracking-wider mb-0.5">
                                        <span className="truncate max-w-[140px]" title={src.metadata?.sourceFilename || src.metadata?.url || 'Direct Context'}>
                                          📁 {src.metadata?.sourceFilename || (src.metadata?.url ? new URL(src.metadata.url).hostname : 'Direct Input')}
                                        </span>
                                        <span className="text-emerald-400 shrink-0">
                                          SCORE: {(src.score * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      <p className="text-[8.5px] leading-normal text-slate-500 whitespace-pre-wrap select-text selection:bg-purple-500/30">
                                        "{src.text}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {sendingPlayground && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px]">
                        <FiLoader className="animate-spin text-xs" />
                        <span>&gt;&gt; RETRIEVING_VECTOR_RESPONSE...</span>
                      </div>
                    )}
                    <div ref={playgroundEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handlePlaygroundSend} className={`p-2.5 border-t flex gap-2 shrink-0 ${darkMode ? 'border-purple-500/10' : 'border-slate-200'}`}>
                    <button 
                      type='button' 
                      onClick={startSandboxVoiceInput}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-none ${isRecordingSandbox ? 'bg-red-600 text-white animate-pulse' : darkMode ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                      title={isRecordingSandbox ? "Recording voice..." : "Voice input (Speech-to-Text)"}
                    >
                      <FiMic size={12} className={isRecordingSandbox ? "animate-pulse" : ""} />
                    </button>
                    <input 
                      type='text' 
                      placeholder={isRecordingSandbox ? 'Speak now to type...' : 'Send test prompt...'} 
                      value={playgroundInput}
                      onChange={e => setPlaygroundInput(e.target.value)}
                      className={`flex-1 h-8 text-[10px] px-3 focus:outline-none rounded-lg border font-mono ${darkMode ? 'bg-[#050812] border-white/10 text-white focus:border-purple-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500/50'}`} 
                    />
                    <button type='submit' className='w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer border-none'>
                      <FiSend size={11} />
                    </button>
                  </form>
                </div>
              </Section>

              {/* Advanced Settings */}
              <Section 
                darkMode={darkMode}
                nodeLabel="NODE_SPEECH_TUNING_05"
                title="Model Calibration" 
                subtitle="Calibrate speech model guidelines & positioning context"
              >
                <div className='space-y-4 text-left font-mono'>
                  {/* Voice synthesis gender */}
                  <div>
                    <label className='text-[8px] uppercase tracking-wider text-slate-500 block mb-2'>// Vocal Identity</label>
                    <div className='grid grid-cols-2 gap-2'>
                      <button 
                        onClick={() => { setVoiceGender('female'); toast.success("Voice set to Natural Female"); }}
                        className={`h-9 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${voiceGender === 'female' ? 'bg-purple-600/10 border-purple-500/50 text-purple-400' : darkMode ? 'bg-white/[0.02] border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        FEMALE_NODE
                      </button>
                      <button 
                        onClick={() => { setVoiceGender('male'); toast.success("Voice set to Natural Male"); }}
                        className={`h-9 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${voiceGender === 'male' ? 'bg-purple-600/10 border-purple-500/50 text-purple-400' : darkMode ? 'bg-white/[0.02] border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        MALE_NODE
                      </button>
                    </div>
                  </div>

                  {/* Widget layout alignment */}
                  <div>
                    <label className='text-[8px] uppercase tracking-wider text-slate-500 block mb-2'>// Position Align</label>
                    <div className='grid grid-cols-2 gap-2'>
                      <button 
                        onClick={() => { setWidgetPlacement('left'); toast.success("Position set to Bottom-Left"); }}
                        className={`h-9 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${widgetPlacement === 'left' ? 'bg-purple-600/10 border-purple-500/50 text-purple-400' : darkMode ? 'bg-white/[0.02] border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        BOTTOM_L
                      </button>
                      <button 
                        onClick={() => { setWidgetPlacement('right'); toast.success("Position set to Bottom-Right"); }}
                        className={`h-9 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${widgetPlacement === 'right' ? 'bg-purple-600/10 border-purple-500/50 text-purple-400' : darkMode ? 'bg-white/[0.02] border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        BOTTOM_R
                      </button>
                    </div>
                  </div>

                  {/* Welcoming Greeting customizer */}
                  <div className="mb-2">
                    <label className='text-[8px] uppercase tracking-wider text-slate-500 block mb-2'>// Welcome Greeting</label>
                    <ModeInput 
                      placeholder="Enter greet message..." 
                      value={welcomeGreeting} 
                      onChange={e => setWelcomeGreeting(e.target.value)} 
                      darkMode={darkMode} 
                    />
                  </div>

                  <button 
                    onClick={saveCalibration}
                    className="w-full h-10 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all cursor-pointer border-none font-mono"
                    style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
                  >
                    SAVE CALIBRATION SETTINGS
                  </button>
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* ── EDIT / SETUP FORM ── */}
        {(editAssistant || !user.isSetupComplete) && (
          <>
            {/* Custom keyframes injected via style tag to ensure animation compatibility */}
            <style>{`
              @keyframes spin-reverse {
                from { transform: rotate(0deg); }
                to { transform: rotate(-360deg); }
              }
              .animate-spin-reverse {
                animation: spin-reverse 15s linear infinite;
              }
            `}</style>
            
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 text-left mt-4'>
              {/* Left Column: Form Settings (Col-span 7) */}
              <div className='lg:col-span-7 space-y-6'>
                {/* Basic Info */}
                <Section 
                  darkMode={darkMode}
                  nodeLabel="CFG_BASIC_01"
                  title="Basic Configuration" 
                  subtitle="Describe your business and model parameters"
                >
                  <div className='space-y-4'>
                    <div>
                      <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block mb-1.5 font-bold">// Assistant Name</span>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 font-mono text-[9px] pointer-events-none select-none">
                          <HiOutlineMicrophone className="text-xs" />
                          <span>[SYS_ID]:</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="e.g. Voxa" 
                          value={assistantName}
                          onChange={e => setAssistantName(e.target.value)}
                          className={`w-full h-12 pl-[74px] pr-4 border text-sm rounded-xl focus:outline-none transition-all font-mono ${darkMode ? 'bg-[#050812] border-white/10 text-white placeholder:text-slate-700 focus:border-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500/50 focus:bg-white'}`} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block mb-1.5 font-bold">// Corporate Label</span>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 font-mono text-[9px] pointer-events-none select-none">
                            <span>[SYS_LABEL]:</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="e.g. VoxaAI Corp" 
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            className={`w-full h-12 pl-[90px] pr-4 border text-sm rounded-xl focus:outline-none transition-all font-mono ${darkMode ? 'bg-[#050812] border-white/10 text-white placeholder:text-slate-700 focus:border-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500/50 focus:bg-white'}`} 
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block mb-1.5 font-bold">// Operational Domain</span>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 font-mono text-[9px] pointer-events-none select-none">
                            <span>[SYS_SEGMENT]:</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="e.g. E-commerce, SaaS" 
                            value={businessType}
                            onChange={e => setBusinessType(e.target.value)}
                            className={`w-full h-12 pl-[106px] pr-4 border text-sm rounded-xl focus:outline-none transition-all font-mono ${darkMode ? 'bg-[#050812] border-white/10 text-white placeholder:text-slate-700 focus:border-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500/50 focus:bg-white'}`} 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block mb-1.5 font-bold">// Knowledge Base Context</span>
                      <div className="relative">
                        <div className="absolute left-4 top-3 flex items-center gap-1.5 text-slate-500 font-mono text-[9px] pointer-events-none select-none">
                          <span>[SYS_CTX]:</span>
                        </div>
                        <textarea 
                          rows={4}
                          placeholder="Describe your services, products, and business guidelines so your assistant can answer user queries accurately." 
                          value={businessDescription}
                          onChange={e => setBusinessDescription(e.target.value)}
                          className={`w-full pl-[78px] pr-4 py-3 border text-sm rounded-xl focus:outline-none transition-all font-mono resize-none ${darkMode ? 'bg-[#050812] border-white/10 text-white placeholder:text-slate-700 focus:border-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500/50 focus:bg-white'}`} 
                        />
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Appearance */}
                <Section 
                  darkMode={darkMode}
                  nodeLabel="CFG_THEME_02"
                  title="Appearance & Vocal Tone" 
                  subtitle="Select styling parameters and tone of voice output"
                >
                  <div className='mb-6 text-left'>
                    <p className='text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3 font-mono'>Visual Theme</p>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                      {THEMES.map(t => {
                        const isSelected = theme === t.value;
                        const selectionGlow = isSelected ? t.glow : 'border-white/[0.06] hover:border-white/20';
                        return (
                          <button 
                            key={t.value} 
                            onClick={() => setTheme(t.value)}
                            className={`relative py-4 rounded-xl border-2 bg-gradient-to-br ${t.gradient} transition-all cursor-pointer flex flex-col items-center gap-2 ${selectionGlow}`}
                          >
                            {isSelected && <FiCheck className="absolute top-2 right-2 text-xs text-white" />}
                            <span className={`text-xl ${isSelected ? t.text : 'text-slate-500'}`}>{t.icon}</span>
                            <span className={`text-xs font-bold capitalize ${isSelected ? 'text-white' : 'text-slate-500'}`}>{t.label}</span>
                            <span className="text-[6.5px] font-mono text-slate-500/70 tracking-tight text-center px-1">
                              {t.spec}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className='text-left'>
                    <p className='text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3 font-mono'>Assistant Vocal Tone</p>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                      {TONES.map(t => {
                        const isSelected = tone === t.value;
                        return (
                          <button 
                            key={t.value} 
                            onClick={() => setTone(t.value)}
                            className={`relative py-4 px-4 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between h-28 ${isSelected ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'border-white/[0.02] bg-white/[0.02] hover:border-white/20'}`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div>
                                <p className={`text-sm font-bold capitalize ${isSelected ? 'text-white' : 'text-slate-400'}`}>{t.label}</p>
                                <p className={`text-[10px] mt-1 leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{t.desc}</p>
                              </div>
                              <span className="text-lg opacity-85 shrink-0">{t.icon}</span>
                            </div>
                            <div className="mt-3 border-t border-white/5 pt-1 text-[7px] font-mono text-slate-500 tracking-wider w-full text-right">
                              {t.metrics}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Section>

                {/* Gemini API Key */}
                <Section
                  darkMode={darkMode}
                  nodeLabel="CFG_KEY_03"
                  title="Gemini API Key"
                  subtitle="Connect your custom Google AI Studio key"
                  action={
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-emerald-500 rounded-xl hover:opacity-95 transition-all cursor-pointer border-none font-mono">
                      <FiExternalLink size={12} /> GET_KEY
                    </a>
                  }
                >
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 font-mono text-[9px] pointer-events-none select-none">
                      <HiOutlineKey className="text-xs" />
                      <span>[SYS_KEY]:</span>
                    </div>
                    <input
                      type={showKey ? "text" : "password"}
                      placeholder="AIza..."
                      value={geminiApiKey}
                      onChange={e => setGeminiApiKey(e.target.value)}
                      className={`w-full h-12 pl-[86px] pr-14 border text-sm font-mono rounded-xl focus:outline-none transition-all ${darkMode ? 'bg-[#050812] border-white/10 text-white placeholder:text-slate-700 focus:border-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500/50'}`}
                    />
                    <button type="button" onClick={() => setShowKey(!showKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer font-semibold">
                      {showKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className='text-xs text-slate-600 mt-3 flex items-center gap-1.5 font-mono'>
                    <FiCheck className="text-emerald-500" />
                    Your API key is securely encrypted and saved directly to the database.
                  </p>
                </Section>

                {/* Save Button */}
                <button 
                  onClick={saveAssistant} 
                  disabled={loading || !canSave}
                  style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                  className='w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(139,92,246,0.25)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)] transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed font-mono'
                >
                  {loading
                    ? <><FiLoader className='animate-spin' /> SYS_COMMITTING_CHANGES…</>
                    : <><HiOutlineSparkles /> {user.isSetupComplete ? "COMMIT_CONFIGURATION_SETTINGS" : "DEPLOY_ASSISTANT_MODEL"}</>
                  }
                </button>

                {user.isSetupComplete && (
                  <button 
                    onClick={() => setEditAssistant(false)}
                    className={`w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-solid font-mono ${darkMode ? 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                  >
                    DISMISS_EDITING
                  </button>
                )}
              </div>

              {/* Right Column: Interactive Widget Preview & Custom Avatar (Col-span 5) */}
              <div className='lg:col-span-5 lg:sticky lg:top-6 space-y-6'>
                <Section 
                  darkMode={darkMode}
                  nodeLabel="MON_PREVIEW_04"
                  title="Widget Live Preview" 
                  subtitle="Configure custom avatar and toggle simulated launcher layout"
                >
                  {/* Custom Avatar Upload Area */}
                  <div className="mb-5 flex flex-col items-center gap-4 bg-black/25 rounded-2xl border border-purple-500/10 p-5 relative text-left">
                    <span className="absolute top-2 right-3 text-[7px] font-mono text-purple-400/40 uppercase tracking-widest font-bold">// AVATAR_VAULT</span>
                    
                    <div className="flex items-center gap-4 w-full">
                      {/* Avatar Image preview circle */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-purple-500/20 bg-purple-950/20 flex items-center justify-center shrink-0">
                        {assistantAvatar ? (
                          <img src={assistantAvatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <img src={logo} alt="default logo" className="w-full h-full object-cover opacity-80" />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0 font-mono">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">// CUSTOM_AVATAR_NODE</p>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                          This image overrides the default floating launcher logo when embedded on your website.
                        </p>
                      </div>
                    </div>
                    
                    {/* Drag & Drop Upload Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingAvatar(false); }}
                      onDrop={handleAvatarDrop}
                      onClick={() => document.getElementById('avatar-file-input').click()}
                      className={`w-full border border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${isDraggingAvatar ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/30 hover:bg-white/[0.01]'}`}
                    >
                      <input id='avatar-file-input' type='file' accept='image/*' onChange={handleAvatarFileUpload} className='hidden' />
                      <span className="text-[10px] font-semibold text-slate-300 font-mono uppercase tracking-wider">
                        {isDraggingAvatar ? 'Drop Image Node Here' : 'Drag & Drop or Click to Upload'}
                      </span>
                      <span className="text-[8px] text-slate-600 font-mono mt-1">PNG, JPG, SVG up to 2MB</span>
                    </div>

                    {assistantAvatar && (
                      <button 
                        onClick={() => { setAssistantAvatar(""); toast.success("Reset to default launcher logo"); }}
                        className="h-8 w-full border border-red-500/20 hover:border-red-500/50 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer border-none"
                      >
                        // RESTORE_DEFAULT_LAUNCHER
                      </button>
                    )}
                  </div>

                  {/* Web Node Widget Mockup (Browser Canvas) */}
                  <div className="w-full h-80 bg-[#050810]/95 border border-purple-500/10 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                    {/* Browser Mockup Title Bar */}
                    <div className="w-full flex items-center justify-between border-b border-white/5 pb-2 select-none opacity-40 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500/60" />
                        <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                        <span className="w-2 h-2 rounded-full bg-green-500/60" />
                      </div>
                      <div className="bg-white/5 text-[7px] font-mono px-6 py-0.5 rounded text-slate-500">https://yourcompany.com</div>
                      <div className="w-8" />
                    </div>

                    {/* Browser Mockup Content */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 select-none opacity-[0.03] select-none shrink-0 pointer-events-none">
                      <div className="w-2/3 h-3 bg-white rounded mb-2" />
                      <div className="w-1/2 h-2 bg-white rounded mb-4" />
                      <div className="w-full grid grid-cols-3 gap-2">
                        <div className="h-8 bg-white rounded" />
                        <div className="h-8 bg-white rounded" />
                        <div className="h-8 bg-white rounded" />
                      </div>
                    </div>

                    {/* Click tip indicator */}
                    <div className="absolute left-4 bottom-4 text-[7.5px] font-mono text-slate-500 tracking-tight flex items-center gap-1.5 animate-pulse pointer-events-none">
                      <span>&gt;&gt; CLICK LAUNCHER BUBBLE TO TEST</span>
                    </div>

                    {/* Dynamic widget styling logic */}
                    {(() => {
                      const getWidgetThemeClasses = () => {
                        switch(theme) {
                          case "light":
                            return {
                              launcher: "bg-yellow-400 text-slate-900 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
                              popup: "bg-white text-slate-800 border border-slate-200 shadow-xl",
                              popupHeader: "bg-slate-50 border-b border-slate-100",
                              orbBg: "bg-yellow-400/20 border-yellow-500/40",
                              orbGlow: "bg-yellow-400/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]",
                              micBtn: "bg-yellow-400 text-slate-900",
                              textColor: "text-slate-700",
                              subText: "text-slate-400",
                              titleColor: "text-slate-900",
                            };
                          case "glass":
                            return {
                              launcher: "bg-cyan-500/20 border border-cyan-400/45 text-cyan-300 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.25)]",
                              popup: "bg-slate-950/80 text-white border border-cyan-500/20 backdrop-blur-md shadow-xl",
                              popupHeader: "bg-cyan-500/5 border-b border-cyan-500/10",
                              orbBg: "bg-cyan-500/15 border-cyan-500/30",
                              orbGlow: "bg-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]",
                              micBtn: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
                              textColor: "text-slate-300",
                              subText: "text-slate-500",
                              titleColor: "text-white",
                            };
                          case "neon":
                            return {
                              launcher: "bg-purple-950/30 border border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]",
                              popup: "bg-[#0c0f22]/95 text-white border border-purple-500/30 shadow-2xl",
                              popupHeader: "bg-purple-950/40 border-b border-purple-500/20",
                              orbBg: "bg-pink-500/15 border-pink-500/30",
                              orbGlow: "bg-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.45)]",
                              micBtn: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
                              textColor: "text-slate-200",
                              subText: "text-slate-500",
                              titleColor: "text-white",
                            };
                          case "dark":
                          default:
                            return {
                              launcher: "bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.25)]",
                              popup: "bg-[#0c0f22]/95 text-white border border-indigo-500/20 shadow-xl",
                              popupHeader: "bg-indigo-950/40 border-b border-indigo-500/10",
                              orbBg: "bg-indigo-500/15 border-indigo-500/30",
                              orbGlow: "bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.35)]",
                              micBtn: "bg-gradient-to-r from-indigo-600 to-slate-900 text-white border border-indigo-500/30",
                              textColor: "text-slate-300",
                              subText: "text-slate-500",
                              titleColor: "text-white",
                            };
                        }
                      };
                      const widgetStyle = getWidgetThemeClasses();

                      return (
                        <>
                          {/* Floating Launcher Button */}
                          <button 
                            onClick={() => setMockWidgetOpen(!mockWidgetOpen)}
                            className={`absolute bottom-4 ${widgetPlacement === 'left' ? 'left-4' : 'right-4'} w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden z-20 ${widgetStyle.launcher}`}
                          >
                            <img src={assistantAvatar || logo} alt="logo" className="w-full h-full object-cover rounded-full" />
                          </button>

                          {/* Mockup Chat Widget Window */}
                          {mockWidgetOpen && (
                            <div className={`absolute bottom-18 ${widgetPlacement === 'left' ? 'left-4' : 'right-4'} w-60 rounded-2xl z-25 overflow-hidden flex flex-col transition-all duration-300 ${widgetStyle.popup}`}>
                              {/* Header */}
                              <div className={`p-4 text-left flex flex-col items-center text-center relative ${widgetStyle.popupHeader}`}>
                                {/* Concentric Orb mockup */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center relative mb-2 ${widgetStyle.orbBg}`}>
                                  <div className={`absolute inset-1.5 rounded-full animate-pulse ${widgetStyle.orbGlow}`} />
                                  <div className="absolute flex items-center justify-center">
                                    <img src={assistantAvatar || logo} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                                  </div>
                                </div>
                                
                                <h4 className={`text-[10px] font-bold font-mono tracking-wide ${widgetStyle.titleColor}`}>
                                  Hello! I'm {assistantName || "Voxa"}
                                </h4>
                                <p className={`text-[8px] font-mono leading-relaxed mt-1 ${widgetStyle.subText}`}>
                                  {welcomeGreeting ? (
                                    welcomeGreeting.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)
                                  ) : (
                                    <>
                                      Welcome to {businessName || "your company"}.
                                      <br />
                                      Ask anything about your website.
                                    </>
                                  )}
                                </p>
                                <div className="text-[6.5px] font-mono text-slate-500 uppercase tracking-widest mt-2 border border-white/5 rounded px-1.5 py-0.5 bg-black/10">
                                  Tap button to Speak
                                </div>
                              </div>
                              
                              {/* Footer mockup */}
                              <div className="p-2.5 flex items-center justify-center border-t border-white/5 bg-black/20 gap-2 shrink-0">
                                <button disabled className="w-6 h-6 rounded-full bg-red-950/20 text-red-500/40 flex items-center justify-center text-[9px] font-mono cursor-default border-none">&#9632;</button>
                                <button className={`w-7 h-7 rounded-full flex items-center justify-center ${widgetStyle.micBtn} border-none`}>
                                  <img src="http://localhost:5173/mic.svg" alt="mic" className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </Section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Builder
