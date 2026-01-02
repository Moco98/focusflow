
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, BarChart2, CheckSquare, Sun, Moon, Home, Compass, User, Settings, X, Globe, Camera, Smile, Upload } from 'lucide-react';
import { Goal, FocusSession, DailyLog, Task, Subtask, UserProfile } from './types';
import { loadGoals, saveGoals, loadSessions, saveSessions, loadLogs, saveLogs } from './services/storage';
import GoalTree from './components/GoalTree';
import Timer from './components/Timer';
import CalendarView from './components/CalendarView';
import StatisticsDashboard from './components/StatisticsDashboard';

const App: React.FC = () => {
  // Global State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('focusflow_profile');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      avatar: '😊', // Default emoji
      language: 'en'
    };
  });
  const [showSettings, setShowSettings] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'goals' | 'calendar' | 'stats' | 'timer'>('goals');
  
  // Timer State Context
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [timerSubtaskId, setTimerSubtaskId] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    setGoals(loadGoals());
    setSessions(loadSessions());
    setLogs(loadLogs());
    
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Theme Side Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save Data Side Effects
  useEffect(() => saveGoals(goals), [goals]);
  useEffect(() => saveSessions(sessions), [sessions]);
  useEffect(() => saveLogs(logs), [logs]);
  useEffect(() => localStorage.setItem('focusflow_profile', JSON.stringify(userProfile)), [userProfile]);

  // Translations
  const t = {
    en: {
      home: 'Home',
      journal: 'Journal',
      stats: 'Stats',
      settings: 'Settings',
      editProfile: 'Edit Profile',
      name: 'Name',
      language: 'Language',
      avatar: 'Avatar',
      save: 'Save',
      english: 'English',
      chinese: 'Chinese',
      uploadPhoto: 'Upload Photo',
      pickEmoji: 'Pick Emoji',
      emojiPlaceholder: 'Type an emoji...'
    },
    zh: {
      home: '首页',
      journal: '日记',
      stats: '统计',
      settings: '设置',
      editProfile: '编辑个人资料',
      name: '昵称',
      language: '语言',
      avatar: '头像',
      save: '保存',
      english: '英语',
      chinese: '中文',
      uploadPhoto: '上传图片',
      pickEmoji: '选择表情',
      emojiPlaceholder: '输入表情...'
    }
  };

  const labels = t[userProfile.language];

  // Handlers
  const handleAddGoal = (title: string, color?: string) => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title,
      color: color || 'clean',
      createdAt: Date.now(),
      tasks: []
    };
    setGoals([...goals, newGoal]);
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals(goals.map(g => g.id === goalId ? { ...g, ...updates } : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleAddTask = (goalId: string, task: Omit<Task, 'id' | 'parentId' | 'subtasks' | 'isCompleted' | 'logs'>) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: [...g.tasks, { 
              ...task, 
              id: crypto.randomUUID(), 
              parentId: goalId, 
              subtasks: [], 
              isCompleted: false,
              totalTimeSpent: 0 // Initialize total time spent
          }]
        };
      }
      return g;
    }));
  };

  const handleUpdateTask = (goalId: string, taskId: string, updates: Partial<Task>) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        };
      }
      return g;
    }));
  };

  const handleDeleteTask = (goalId: string, taskId: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: g.tasks.filter(t => t.id !== taskId)
        };
      }
      return g;
    }));
  };

  const handleAddSubtask = (goalId: string, taskId: string, title: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: [...t.subtasks, { id: crypto.randomUUID(), parentId: taskId, title, isCompleted: false, totalTimeSpent: 0 }]
              };
            }
            return t;
          })
        };
      }
      return g;
    }));
  };

  const handleUpdateSubtask = (goalId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, ...updates } : s)
              };
            }
            return t;
          })
        };
      }
      return g;
    }));
  };

  const handleDeleteSubtask = (goalId: string, taskId: string, subtaskId: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: t.subtasks.filter(s => s.id !== subtaskId)
              };
            }
            return t;
          })
        };
      }
      return g;
    }));
  };

  const handleToggleSubtask = (goalId: string, taskId: string, subtaskId: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
               return {
                 ...t,
                 subtasks: t.subtasks.map(s => {
                    if (s.id === subtaskId) {
                        const newIsCompleted = !s.isCompleted;
                        return { 
                            ...s, 
                            isCompleted: newIsCompleted,
                            completedAt: newIsCompleted ? Date.now() : undefined 
                        };
                    }
                    return s;
                 })
               };
            }
            return t;
          })
        };
      }
      return g;
    }));
  };

  const handleStartFocus = (taskId: string, subtaskId?: string) => {
    setTimerTaskId(taskId);
    setTimerSubtaskId(subtaskId || null);
    setActiveTab('timer');
  };

  const handleSessionComplete = (session: FocusSession) => {
    setSessions(prev => [...prev, session]);
    
    // Update goal > task > (optional) subtask with new time
    setGoals(goals.map(g => {
         if (g.id === session.goalId) {
           return {
             ...g,
             tasks: g.tasks.map(t => {
               if (t.id === session.taskId) {
                 
                 // 1. Calculate new total time for the main task
                 const currentTotal = t.totalTimeSpent || 0;
                 const newTotal = currentTotal + session.durationMinutes;

                 // 2. Check if this task is now completed (for Time-based tasks)
                 let isCompleted = t.isCompleted;
                 if (t.type === 'time' && t.targetDurationMinutes) {
                    isCompleted = newTotal >= t.targetDurationMinutes;
                 }

                 // 3. Update Subtask if applicable
                 let updatedSubtasks = t.subtasks;
                 if (session.subtaskId) {
                    updatedSubtasks = t.subtasks.map(s => s.id === session.subtaskId ? { ...s, totalTimeSpent: s.totalTimeSpent + session.durationMinutes } : s);
                 }

                 return {
                   ...t,
                   totalTimeSpent: newTotal,
                   isCompleted,
                   completedAt: isCompleted && !t.isCompleted ? Date.now() : t.completedAt, // Set completedAt if just finished
                   subtasks: updatedSubtasks
                 };
               }
               return t;
             })
           };
         }
         return g;
    }));
  };

  const handleSaveLog = (log: DailyLog) => {
    setLogs(prev => {
      const existing = prev.findIndex(l => l.date === log.date);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = log;
        return copy;
      }
      return [...prev, log];
    });
  };

  // Avatar Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (activeTab === 'timer') {
    return (
      <Timer 
        taskId={timerTaskId} 
        subtaskId={timerSubtaskId} 
        goals={goals}
        onSessionComplete={handleSessionComplete}
        onExit={() => setActiveTab('goals')}
      />
    );
  }

  const isImageAvatar = userProfile.avatar.startsWith('data:') || userProfile.avatar.startsWith('http');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-warm-bg dark:bg-[#121212] transition-colors duration-500">
      
      {/* Main Content Area - Left Side */}
      <main className="flex-1 h-full relative z-10 py-6 pl-6 pr-4">
        <div className="h-full w-full bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-soft overflow-hidden relative transition-all duration-500">
            {activeTab === 'goals' && (
            <GoalTree 
                key={userProfile.language}
                goals={goals} 
                userProfile={userProfile}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={handleAddSubtask}
                onUpdateSubtask={handleUpdateSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                onStartFocus={handleStartFocus}
                onDeleteGoal={handleDeleteGoal}
                onToggleSubtask={handleToggleSubtask}
            />
            )}
            {activeTab === 'calendar' && (
            <CalendarView 
                key={userProfile.language}
                sessions={sessions}
                logs={logs}
                goals={goals}
                userProfile={userProfile}
                onSaveLog={handleSaveLog}
            />
            )}
            {activeTab === 'stats' && (
            <StatisticsDashboard 
                key={userProfile.language}
                sessions={sessions}
                goals={goals}
                userProfile={userProfile}
                isDarkMode={isDarkMode}
            />
            )}
        </div>
      </main>

      {/* Right Sidebar - Clean Minimalist Style */}
      <aside className="w-24 h-full flex flex-col items-center py-10 z-20 flex-shrink-0">
        
        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
          {[
            { id: 'goals', label: labels.home, icon: Home },
            { id: 'calendar', label: labels.journal, icon: Calendar },
            { id: 'stats', label: labels.stats, icon: BarChart2 },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className="group relative flex items-center justify-center w-14 h-14"
            >
              {/* Active Indicator - Black Circle */}
              <div className={`
                absolute inset-0 rounded-2xl transition-all duration-300 ease-spring
                ${activeTab === item.id 
                  ? 'bg-black dark:bg-white scale-100 shadow-lg' 
                  : 'bg-transparent scale-0 group-hover:bg-black/5 dark:group-hover:bg-white/10 group-hover:scale-90'}
              `}></div>

              {/* Icon */}
              <div className={`
                relative z-10 transition-colors duration-300
                ${activeTab === item.id 
                  ? 'text-white dark:text-black' 
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
              `}>
                <item.icon 
                  size={26} 
                  strokeWidth={2.5}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        {/* Profile / Dark Mode */}
        <div className="mt-auto flex flex-col gap-6 items-center">
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:shadow-md transition-all"
            >
                {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            
            <button 
                onClick={() => setShowSettings(true)}
                className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-md transition-transform hover:scale-105 flex items-center justify-center text-2xl"
            >
                {isImageAvatar ? (
                    <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{userProfile.avatar}</span>
                )}
            </button>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.editProfile}</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Avatar Preview & Selection */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                             {isImageAvatar ? (
                                <img src={userProfile.avatar} alt="Current Avatar" className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-4xl">{userProfile.avatar}</span>
                             )}
                        </div>
                        
                        <div className="flex gap-2 w-full">
                           {/* File Upload */}
                           <label className="flex-1 cursor-pointer">
                              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-black/40 transition-colors border border-dashed border-gray-200 dark:border-gray-700 h-full">
                                  <Upload size={20} className="text-gray-400 mb-1" />
                                  <span className="text-xs font-bold text-gray-500">{labels.uploadPhoto}</span>
                              </div>
                           </label>

                           {/* Emoji Picker (Simple Input for now) */}
                           <div className="flex-1 flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-1 justify-center text-gray-400">
                                    <Smile size={20} />
                                    <span className="text-xs font-bold">{labels.pickEmoji}</span>
                                </div>
                                <input 
                                    type="text" 
                                    maxLength={2}
                                    placeholder={labels.emojiPlaceholder}
                                    className="w-full text-center bg-transparent outline-none text-xl"
                                    onChange={(e) => {
                                        if (e.target.value) setUserProfile(prev => ({ ...prev, avatar: e.target.value }));
                                    }}
                                />
                           </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{labels.name}</label>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/20 p-3 rounded-2xl">
                            <User size={18} className="text-gray-400" />
                            <input 
                                type="text" 
                                value={userProfile.name}
                                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                                className="bg-transparent w-full outline-none text-gray-900 dark:text-white font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{labels.language}</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setUserProfile({...userProfile, language: 'en'})}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${userProfile.language === 'en' ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-gray-100 dark:border-gray-700 text-gray-500'}`}
                            >
                                {labels.english}
                            </button>
                            <button 
                                onClick={() => setUserProfile({...userProfile, language: 'zh'})}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${userProfile.language === 'zh' ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-gray-100 dark:border-gray-700 text-gray-500'}`}
                            >
                                {labels.chinese}
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full mt-8 bg-warm-accent text-warm-brown py-4 rounded-2xl font-bold text-lg hover:brightness-105 transition-all shadow-lg"
                >
                    {labels.save}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
