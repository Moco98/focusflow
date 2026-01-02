
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Music2, Plus, Minus, Eye, EyeOff, Film, Square } from 'lucide-react';
import { FocusSession, Goal, Task, Subtask } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TimerProps {
  taskId: string | null;
  subtaskId: string | null;
  goals: Goal[];
  onSessionComplete: (session: FocusSession) => void;
  onExit: () => void;
}

const Timer: React.FC<TimerProps> = ({ taskId, subtaskId, goals, onSessionComplete, onExit }) => {
  // Find context
  let activeGoal: Goal | undefined;
  let activeTask: Task | undefined;
  let activeSubtask: Subtask | undefined;

  if (taskId) {
    for (const g of goals) {
      const t = g.tasks.find(t => t.id === taskId);
      if (t) {
        activeGoal = g;
        activeTask = t;
        if (subtaskId) {
          activeSubtask = t.subtasks.find(s => s.id === subtaskId);
        }
        break;
      }
    }
  }

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60); // Keep track of base time
  const [isActive, setIsActive] = useState(false);
  
  // Changed: Default is empty (No video, solid background)
  const [bvid, setBvid] = useState(''); 
  const [inputBvid, setInputBvid] = useState(''); // Temporary state for input
  
  const [showBilibiliInput, setShowBilibiliInput] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false); // Toggle between Clean UI and Immersive Video

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Request Notification permission on mount
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // Check for completion (Natural End)
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
        handleComplete(initialTime); // Elapsed time is full duration
    }
  }, [timeLeft, isActive, initialTime]);

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch (e) {
          console.error("Notification failed", e);
        }
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
             try {
                new Notification(title, { body, icon: '/favicon.ico' });
             } catch (e) { console.error(e); }
          }
        });
      }
    }
  };

  // Reliable pleasant melody using Web Audio API
  const playAlarm = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        // A pleasant "Dreamy" Major 9th Arpeggio to signal success
        const notes = [
            { freq: 523.25, delay: 0.0, duration: 3.0 },    // C5 (Root)
            { freq: 659.25, delay: 0.5, duration: 3.0 },    // E5
            { freq: 783.99, delay: 1.0, duration: 3.0 },    // G5
            { freq: 987.77, delay: 1.5, duration: 3.5 },    // B5
            { freq: 1174.66, delay: 2.0, duration: 4.0 }    // D6 (Sparkle)
        ];

        notes.forEach(({ freq, delay, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine'; 
            osc.frequency.value = freq;
            
            const now = ctx.currentTime;
            const startTime = now + delay;
            const stopTime = startTime + duration;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
            
            osc.start(startTime);
            osc.stop(stopTime);
        });

    } catch (e) {
        console.error("Audio Playback Error", e);
    }
  };

  // Main Completion Handler
  // elapsedSeconds: Exact seconds spent focused
  const handleComplete = (elapsedSeconds: number) => {
    setIsActive(false);
    
    const durationMinutes = Math.round(elapsedSeconds / 60);

    // Filter out very short sessions (misclicks), unless it was a 1-minute timer that finished
    const isValidSession = durationMinutes >= 1;

    if (isValidSession) {
        // Play the pleasant chime
        playAlarm();

        // Send Browser Notification
        const title = activeTask ? "Focus Session Complete!" : "Session Recorded";
        const body = activeTask 
        ? `You've focused for ${durationMinutes} mins on "${activeTask.title}". Great job!` 
        : `You've recorded ${durationMinutes} mins of focus time.`;
        
        sendNotification(title, body);

        if (activeGoal && activeTask) {
            const now = Date.now();
            // Calculate start time based on duration for accurate logging
            const startTime = now - (elapsedSeconds * 1000);
            
            const session: FocusSession = {
                id: uuidv4(),
                goalId: activeGoal.id,
                taskId: activeTask.id,
                subtaskId: activeSubtask?.id,
                startTime,
                endTime: now,
                durationMinutes: durationMinutes,
                note: 'Pomodoro Session'
            };
            onSessionComplete(session);
        }
    } else {
        // If too short, just reset silently
    }
    
    // Always reset timer to initial state after processing
    resetTimer();
  };

  const toggleTimer = () => {
      // Unlock AudioContext on user interaction
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
      }

      // Request permission on user interaction if not yet granted
      if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
      }

      setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
  };

  const handleStopEarly = () => {
      const elapsed = initialTime - timeLeft;
      // If elapsed is less than 60s, we discard it as accidental
      if (elapsed < 60) {
          resetTimer();
      } else {
          handleComplete(elapsed);
      }
  };

  const adjustTime = (minutes: number) => {
    if (!isActive) {
      const newTime = Math.max(60, timeLeft + minutes * 60); // Minimum 1 min
      setTimeLeft(newTime);
      setInitialTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetBvid = () => {
      if (inputBvid.trim()) {
          setBvid(inputBvid.trim());
          setShowBilibiliInput(false);
      } else {
          setBvid('');
          setShowBilibiliInput(false);
      }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 ${cinemaMode ? 'bg-black' : 'bg-warm-bg dark:bg-[#121212]'}`}>
      
      {/* Background Bilibili Layer - Only render if BVID exists */}
      {bvid && (
          <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${cinemaMode ? 'opacity-100' : 'opacity-20'}`}>
            <div className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-700 ${cinemaMode ? 'bg-transparent' : 'bg-[#F2F2F0] dark:bg-[#121212] mix-blend-overlay'}`}></div>
            <iframe
              src={`//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0&autoplay=1`}
              className="w-full h-full object-cover scale-105 grayscale-[20%]"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              title="Bilibili Background"
              style={{ border: 'none' }}
            ></iframe>
          </div>
      )}
      
      {/* Floating Interface */}
      <div className={`z-20 w-full max-w-2xl p-8 md:p-10 relative flex flex-col items-center animate-in zoom-in duration-500 rounded-[3rem] transition-all duration-700 ${cinemaMode ? 'bg-transparent' : 'bg-[#FFF3D6] dark:bg-black/40 backdrop-blur-xl shadow-soft border border-white/50'}`}>
        
        {/* Top Status */}
        <div className="flex flex-col items-center mb-8 space-y-3 text-center w-full relative">
            {/* Cinema Mode Toggle */}
            <button 
                onClick={() => setCinemaMode(!cinemaMode)}
                className={`absolute right-0 top-0 p-3 rounded-full transition-colors ${cinemaMode ? 'text-white/50 hover:text-white bg-white/10' : 'text-gray-400 hover:text-black bg-white dark:bg-white/10 hover:shadow-md'}`}
                title={cinemaMode ? "Show UI" : "Immersive Mode"}
            >
                {cinemaMode ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>

           <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest shadow-sm transition-colors duration-500 ${cinemaMode ? 'bg-black/50 border-white/20 text-white' : 'bg-white dark:bg-white/10 border-white/50 text-gray-900 dark:text-white'}`}>
             <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
             {activeTask ? 'Focus Task' : 'Free Focus'}
           </div>
           
           <div className={`transition-opacity duration-500 ${cinemaMode ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-4">
                    {activeTask ? activeTask.title : 'Stay Productive'}
                </h2>
                {activeSubtask && <p className="text-gray-500 font-medium mt-1">{activeSubtask.title}</p>}
           </div>
        </div>

        {/* Timer Display & Adjusters - Containerized */}
        <div className={`relative mb-10 w-full transition-all duration-500 ${cinemaMode ? 'scale-110' : 'scale-100'}`}>
            <div className={`flex items-center justify-center gap-4 md:gap-8 w-full p-6 rounded-[2.5rem] ${cinemaMode ? '' : 'bg-white/40 dark:bg-white/5 border border-white/20'}`}>
                {/* Minus Button */}
                {!isActive && !cinemaMode && (
                  <button 
                    onClick={() => adjustTime(-5)}
                    className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-900 dark:text-white shadow-card flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    aria-label="Decrease time"
                  >
                    <Minus size={24} strokeWidth={3} />
                  </button>
                )}

               {/* Time */}
               <div 
                 className={`text-7xl md:text-9xl font-black tracking-wider tabular-nums select-none text-center transition-colors duration-500 ${cinemaMode ? 'text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]' : 'text-gray-900 dark:text-white'}`}
               >
                 {formatTime(timeLeft)}
               </div>

               {/* Plus Button */}
               {!isActive && !cinemaMode && (
                  <button 
                    onClick={() => adjustTime(5)}
                    className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-900 dark:text-white shadow-card flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    aria-label="Increase time"
                  >
                    <Plus size={24} strokeWidth={3} />
                  </button>
                )}
            </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center gap-8 mb-8 transition-opacity duration-500 ${cinemaMode && isActive ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
          {/* Left Button: Stop (if started) or Reset (if not) */}
          {timeLeft !== initialTime ? (
              <button
                onClick={handleStopEarly}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${cinemaMode ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'}`}
                title="Stop & Save Progress"
              >
                <Square size={24} fill="currentColor" />
              </button>
          ) : (
              <button
                onClick={resetTimer}
                disabled={isActive}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${cinemaMode ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200'} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Reset"
              >
                <RotateCcw size={24} />
              </button>
          )}
          
          <button
            onClick={toggleTimer}
            className={`w-24 h-24 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center ${cinemaMode ? 'bg-white text-black' : 'bg-black text-white dark:bg-white dark:text-black'}`}
          >
            {isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
          </button>
          
          <button
            onClick={onExit}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${cinemaMode ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Bilibili Widget */}
        <div className={`w-full rounded-2xl p-4 transition-all duration-300 border ${cinemaMode ? 'bg-black/60 border-white/10 backdrop-blur-md' : 'bg-white/50 dark:bg-black/30 border-white/50 hover:bg-white/80'}`}>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${bvid ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {bvid ? (
                      <Music2 size={18} className="text-white dark:text-black" />
                  ) : (
                      <Film size={18} className="text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div>
                   <div className={`text-sm font-bold ${cinemaMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                       {bvid ? 'Background Video' : 'Silent Mode'}
                   </div>
                   <div className="flex items-center gap-2">
                       <span className={`text-xs font-medium ${cinemaMode ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'}`}>
                           {bvid ? 'Bilibili Player Active' : 'No video selected'}
                       </span>
                       {/* Explicit Hint - Only show if video is active */}
                       {bvid && (
                           <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-sm font-bold cursor-pointer" onClick={() => alert('Tap anywhere on the background video to unmute it.')}>No sound?</span>
                       )}
                   </div>
                </div>
             </div>
             <button 
                onClick={() => setShowBilibiliInput(!showBilibiliInput)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${cinemaMode ? 'text-white/70 hover:text-white bg-white/10' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-white/10 hover:bg-gray-100'}`}
             >
               {bvid ? 'Change' : 'Add Video'}
             </button>
           </div>
           
           {showBilibiliInput && (
              <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2">
                    <input 
                    type="text" 
                    value={inputBvid}
                    onChange={(e) => setInputBvid(e.target.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none font-medium ${cinemaMode ? 'bg-white/10 text-white placeholder:text-white/30' : 'bg-white dark:bg-black/20 text-gray-900 dark:text-white'}`}
                    placeholder="Enter BV ID (e.g. BV1N24y1C7Yh)"
                    />
                    <button 
                    onClick={handleSetBvid}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${cinemaMode ? 'bg-white text-black' : 'bg-black text-white dark:bg-white dark:text-black'}`}
                    >
                    Set
                    </button>
                </div>
                {!bvid && (
                    <div className="flex justify-end">
                        <button 
                            onClick={() => { setInputBvid('BV1N24y1C7Yh'); setBvid('BV1N24y1C7Yh'); setShowBilibiliInput(false); }}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white underline underline-offset-2"
                        >
                            Use "Lofi Girl" Default
                        </button>
                    </div>
                )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Timer;
