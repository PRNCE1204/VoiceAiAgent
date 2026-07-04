(function () {


    // userData

    const script = document.currentScript;
    const userId = script?.dataset?.userId

    let sessionId = sessionStorage.getItem("shifra_session_id");
    if (!sessionId) {
        sessionId = "sess_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
        sessionStorage.setItem("shifra_session_id", sessionId);
    }

    // Load Socket.io client dynamically
    const socketScript = document.createElement("script");
    socketScript.src = "http://localhost:8080/socket.io/socket.io.js";
    document.head.appendChild(socketScript);

    let socket = null;
    socketScript.onload = () => {
        if (window.io) {
            socket = window.io("http://localhost:8080", {
                query: { userId, sessionId }
            });
            setupSocketListeners();
        }
    };

    const theme = "dark"

    let assistantConfig = null


    // load CSS

    const link = document.createElement("link")

    link.rel = "stylesheet"

    link.href = "http://localhost:5173/assistant.css"

    document.head.appendChild(link)


    // Create PopUp

    const popup = document.createElement("div")

    popup.className = `shifra-popup theme-${theme}`

    popup.innerHTML = `
    <div class="shifra-overlay"></div>

    <div class="shifra-content">

       <div class="shifra-top">
            <div class="shifra-orb-wrap">

                <div class="shifra-orb-glow"></div>

                <div class="shifra-orb"></div>

            </div>

            <h2 class="shifra-title">
                Hello! I'm Shifra AI
            </h2>

            <p class="shifra-sub">
                Your smart voice assistant.
                <br />
                Ask anything about your website.
            </p>


            <div class="shifra-status">
                Tap button to Speak
            </div>

            <div class="shifra-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <!-- User Text -->
            <div class="shifra-user-text">
            </div>

            <!-- AI Text -->
            <div class="shifra-ai-text">
            </div>
  
        </div>


        <div class="shifra-bottom">
            <button class="shifra-stop" title="Stop agent">
              &#9632;
            </button>
            <button class="shifra-mic">
               <img 
               src="http://localhost:5173/mic.svg"
               alt="mic"
               class="shifra-mic-icon"/>
            </button>
        </div>
    </div>
    
    `;

    document.body.appendChild(popup);

    // floating Button

    const button = document.createElement("button")

    button.className = `shifra-btn theme-${theme}`

    button.innerHTML = `
    <img 
    src="http://localhost:5173/logo.png"
    alt="logo"
    />`;
    document.body.appendChild(button)




    // toggle popup

    let open = false

    button.onclick = () => {
        open = !open;
        popup.style.display = open ? "flex" : "none";
        if (!open) {
            stopRecording();
            stopPlayback();
        }
    };


    // load Assistant

    const loadAssistant = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/assistant/config/${userId}`)

            const data = await res.json()

            if (data) {
                assistantConfig = data.user
                applyConfig()
            }

        } catch (error) {
            console.log(
                "Assistant Load Error:",
                error
            );
        }
    }


    const applyConfig = () => {
        if (!assistantConfig) return;

        popup.className = `shifra-popup theme-${assistantConfig.theme}`

        button.className = `shifra-btn theme-${assistantConfig.theme}`

        const title = popup.querySelector(".shifra-title")

        title.innerHTML = `Hello! I'm ${assistantConfig.assistantName}`;

        const subTitle = popup.querySelector(".shifra-sub")
        subTitle.innerHTML = `
    Welcome to
    ${assistantConfig.businessName}.
    <br />
    Ask anything about your website.
  `;

        if (assistantConfig.assistantAvatar) {
            const img = button.querySelector("img");
            if (img) {
                img.src = assistantConfig.assistantAvatar;
            }
        }
    }

    loadAssistant()


    // Element


    const status =
        popup.querySelector(
            ".shifra-status"
        );

    const wave =
        popup.querySelector(
            ".shifra-wave"
        );

    const userText =
        popup.querySelector(
            ".shifra-user-text"
        );

    const aiText =
        popup.querySelector(
            ".shifra-ai-text"
        );

    const mic =
        popup.querySelector(
            ".shifra-mic"
        );

    const stopBtn =
        popup.querySelector(
            ".shifra-stop"
        );

    // Initialize to idle state
    mic.classList.add('state-idle');



    // ── Web Audio API PCM Recording & Playback ────────────────────────────────
    let audioContext = null;
    let nextStartTime = 0;
    let activeSources = [];
    let fullBotResponse = "";

    // Microphone variables
    let mediaStream = null;
    let micAudioContext = null;
    let scriptProcessor = null;
    let isListening = false;
    let isAgentSpeaking = false;
    let isSessionActive = false; // tracks if session is running

    // ── UI State Machine ─────────────────────────────────────────────────────
    // states: 'idle' | 'listening' | 'speaking'
    // The red stop button is ALWAYS shown when session is active
    const setUIState = (state) => {
        mic.classList.remove('state-idle', 'state-listening', 'state-speaking');
        // Stop button visible whenever session is active
        stopBtn.style.display = isSessionActive ? 'flex' : 'none';

        if (state === 'idle') {
            mic.classList.add('state-idle');
            status.innerText = 'Tap button to Speak';
            wave.style.opacity = '0';
            isAgentSpeaking = false;
        } else if (state === 'listening') {
            mic.classList.add('state-listening');
            status.innerText = 'Listening...';
            wave.style.opacity = '1';
            isAgentSpeaking = false;
        } else if (state === 'speaking') {
            mic.classList.add('state-speaking');
            status.innerText = 'AI Speaking...';
            wave.style.opacity = '1';
            isAgentSpeaking = true;
        }
    };

    const playAudioChunk = (pcmDataBuffer) => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        // Convert raw 24kHz 16-bit PCM into Float32 for Web Audio API
        const pcm16 = new Int16Array(pcmDataBuffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768.0;
        }

        // Create buffer with sample rate 24000 (matching Gemini API output)
        const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        const currentTime = audioContext.currentTime;
        if (nextStartTime < currentTime) {
            nextStartTime = currentTime;
        }

        activeSources.push(source);
        source.onended = () => {
            const index = activeSources.indexOf(source);
            if (index > -1) {
                activeSources.splice(index, 1);
            }
        };

        source.start(nextStartTime);
        nextStartTime += audioBuffer.duration;
    };

    const stopPlayback = () => {
        activeSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {}
        });
        activeSources = [];

        if (audioContext) {
            try {
                audioContext.close();
            } catch (e) {}
            audioContext = null;
        }
        nextStartTime = 0;
    };

    const resample = (inputBuffer, fromSampleRate, toSampleRate) => {
        if (fromSampleRate === toSampleRate) {
            return inputBuffer;
        }
        const ratio = fromSampleRate / toSampleRate;
        const newLength = Math.round(inputBuffer.length / ratio);
        const result = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            result[i] = inputBuffer[Math.round(i * ratio)];
        }
        return result;
    };

    // ── Start the full hands-free session ────────────────────────────────────
    const startSession = async () => {
        if (isSessionActive) return;

        userText.innerText = "";
        aiText.innerText = "";
        fullBotResponse = "";

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            micAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (micAudioContext.state === "suspended") {
                await micAudioContext.resume();
            }
            const source = micAudioContext.createMediaStreamSource(mediaStream);

            if (socket && socket.connected) {
                socket.emit("start-recording", { sessionId });
            }

            // ScriptProcessorNode downsamples & converts microphone audio in real time
            scriptProcessor = micAudioContext.createScriptProcessor(2048, 1, 1);
            const inputSampleRate = micAudioContext.sampleRate;

            scriptProcessor.onaudioprocess = (e) => {
                if (!socket || !socket.connected || !isSessionActive) return;
                if (isAgentSpeaking) return; // don't send mic audio while agent is talking

                const inputData = e.inputBuffer.getChannelData(0);
                const resampled = resample(inputData, inputSampleRate, 16000);

                // Convert Float32 to 16-bit Signed PCM Little Endian
                const buffer = new ArrayBuffer(resampled.length * 2);
                const view = new DataView(buffer);
                for (let i = 0; i < resampled.length; i++) {
                    let s = Math.max(-1, Math.min(1, resampled[i]));
                    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }

                socket.emit("audio-chunk", buffer);
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(micAudioContext.destination);

            isListening = true;
            isSessionActive = true;
            setUIState('listening');

            // Run Speech Recognition in parallel purely for the transcription logs
            startSpeechRecognitionTranscript();

        } catch (err) {
            console.error("Microphone capture failed:", err);
            status.innerText = "Mic Error";
            isListening = false;
            isSessionActive = false;
        }
    };

    // ── Stop the full session ─────────────────────────────────────────────────
    const stopSession = () => {
        isListening = false;
        isSessionActive = false;

        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (micAudioContext) {
            try {
                micAudioContext.close();
            } catch (e) {}
            micAudioContext = null;
        }

        stopPlayback();
        stopSpeechRecognitionTranscript();
        fullBotResponse = "";

        if (socket && socket.connected) {
            socket.emit("stop-generation");
        }

        setUIState('idle');
    };

    // Parallel Speech Recognition for text logs
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let parallelRec = null;
    let parallelRecError = null;

    const startSpeechRecognitionTranscript = () => {
        if (!SpeechRecognition) return;

        try {
            parallelRec = new SpeechRecognition();
            parallelRec.lang = "en-US";
            parallelRec.continuous = false;
            parallelRec.interimResults = false;

            parallelRec.onresult = (e) => {
                const text = e.results[0][0].transcript;
                // Clear the AI's old spoken text as soon as the user starts speaking a new sentence
                if (aiText.innerText !== "") {
                    aiText.innerText = "";
                    fullBotResponse = "";
                }
                userText.innerText = "You: " + text;
                if (socket && socket.connected) {
                    socket.emit("user-transcript", { text });
                }
            };

            parallelRec.onerror = (e) => {
                if (e.error !== "no-speech" && e.error !== "aborted") {
                    console.warn("Speech recognition error:", e.error);
                }
                parallelRecError = e.error;
            };

            parallelRec.onend = () => {
                if (isListening) {
                    // If it is a critical permission or block error, don't restart to prevent loops
                    if (parallelRecError === "not-allowed" || parallelRecError === "audio-capture" || parallelRecError === "service-not-allowed") {
                        console.warn("Stopping parallel SpeechRecognition due to critical error:", parallelRecError);
                        parallelRecError = null;
                        return;
                    }

                    // For transient errors like no-speech, wait 1.5s. Otherwise, wait 200ms.
                    const delay = (parallelRecError === "no-speech" || parallelRecError === "aborted") ? 1500 : 200;
                    parallelRecError = null;

                    setTimeout(() => {
                        if (isListening) {
                            try {
                                parallelRec.start();
                            } catch (err) {
                                // ignore
                            }
                        }
                    }, delay);
                }
            };

            parallelRec.start();
        } catch (e) {
            console.warn("Parallel transcription recognition failed to start:", e);
        }
    };

    const stopSpeechRecognitionTranscript = () => {
        if (parallelRec) {
            try {
                parallelRec.stop();
            } catch (e) {}
            parallelRec = null;
        }
        parallelRecError = null;
    };

    // Setup Socket Listeners
    const setupSocketListeners = () => {
        if (!socket) return;

        socket.on("agent-ready", () => {
            console.log("[Socket] Gemini Live API ready");
            setUIState('idle');
        });

        socket.on("bot-transcript", (data) => {
            fullBotResponse += data.text;
            aiText.innerText = fullBotResponse;
            if (isSessionActive) setUIState('speaking');
        });

        socket.on("audio-chunk", (data) => {
            playAudioChunk(data);
            if (isSessionActive) setUIState('speaking');
        });

        socket.on("bot-done", () => {
            console.log("[Socket] Bot finished response");
            // Agent done — resume listening if session is still active
            if (isSessionActive) {
                setUIState('listening');
            }
        });

        socket.on("bot-interrupted", () => {
            console.log("[Socket] Bot was interrupted by VAD (user started speaking)");
            stopPlayback();
            fullBotResponse = "";
            aiText.innerText = "";
            if (isSessionActive) setUIState('listening');
        });

        socket.on("stream-error", (data) => {
            console.error("[Socket] Stream error:", data.message);
            status.innerText = "Error: " + data.message;
            isSessionActive = false;
        });
    };

    // ── Mic button: start session ─────────────────────────────────────────────
    mic.onclick = () => {
        if (!isSessionActive) {
            startSession();
        }
        // While session is active, mic button does nothing — use stop button
    };

    // ── Stop button: end session immediately ──────────────────────────────────
    stopBtn.onclick = () => {
        stopSession();
    };

})();
