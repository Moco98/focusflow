import React, { useState } from 'react';
import { eachDayOfInterval, format, endOfMonth, endOfWeek, isSameDay, getDay, addMonths, addYears, startOfMonth, startOfWeek } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { FocusSession, DailyLog, Goal, UserProfile } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, X, ArrowRight, Flame, Clock } from 'lucide-react';

interface CalendarViewProps {
  sessions: FocusSession[];
  logs: DailyLog[];
  goals: Goal[];
  userProfile: UserProfile;
  onSaveLog: (log: DailyLog) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions, logs, goals, userProfile, onSaveLog }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Localization setup
  const locale = userProfile.language === 'zh' ? zhCN : enUS;
  
  const t = {
    en: {
        consistency: 'Consistency',
        journey: 'Your focus journey visualized.',
        dailyBreakdown: 'Daily Breakdown',
        totalFocus: 'Total Focus Time',
        distribution: 'Task Distribution',
        impact: 'Daily Impact',
        noData: 'No data',
        noProgress: 'No goal progress recorded for this day.',
        note: "Today's Note",
        placeholder: "Add a note..."
    },
    zh: {
        consistency: '每日坚持',
        journey: '可视化你的专注旅程。',
        dailyBreakdown: '每日详情',
        totalFocus: '总专注时长',
        distribution: '任务分布',
        impact: '今日成长',
        noData: '无数据',
        noProgress: '今日暂无目标进展。',
        note: "今日笔记",
        placeholder: "添加笔记..."
    }
  };
  const labels = t[userProfile.language];

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { locale }),
    end: endOfWeek(endOfMonth(currentDate), { locale })
  });
  
  // Dynamic week days based on locale
  const weekDays = userProfile.language === 'zh' 
    ? ['日', '一', '二', '三', '四', '五', '六'] 
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const COLORS = ['#FBBF24', '#3B82F6', '#10B981', '#F472B6', '#8B5CF6'];

  // Helper to calculate total focus minutes for a specific day
  const getTotalTimeForDay = (date: Date) => {
    return sessions
      .filter(s => isSameDay(new Date(s.startTime), date))
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  };

  // Helper to get task distribution for a day
  const getDailyStats = (date: Date) => {
     const daySessions = sessions.filter(s => isSameDay(new Date(s.startTime), date));
     
     // Pie Data
     const distribution: Record<string, number> = {};
     daySessions.forEach(s => {
         const goal = goals.find(g => g.id === s.goalId);
         const goalName = goal ? goal.title : 'Unknown';
         distribution[goalName] = (distribution[goalName] || 0) + s.durationMinutes;
     });
     
     const pieData = Object.keys(distribution).map(name => ({
         name,
         value: distribution[name]
     }));

     // Goal Progress Increments (Simple visualization of which goals were active)
     const goalIncrements: Record<string, number> = {};
     daySessions.forEach(s => {
         const goal = goals.find(g => g.id === s.goalId);
         const task = goal?.tasks.find(t => t.id === s.taskId);
         if (goal && task && task.type === 'time' && task.targetDurationMinutes) {
             const increment = (s.durationMinutes / task.targetDurationMinutes) * 100;
             goalIncrements[goal.title] = (goalIncrements[goal.title] || 0) + increment;
         }
     });

     return { pieData, goalIncrements };
  };

  // Opacity based on intensity using "Soleil" colors:
  // #FFF5D6, #FFEBAD, #FFE085, #FFD65C, #FFCC33
  const getIntensityStyle = (minutes: number) => {
      // Changed: Return empty for 0 to let Tailwind classes handle background (Dark mode support)
      if (minutes === 0) return {}; 
      
      if (minutes < 30) return { backgroundColor: '#FFF5D6' };
      if (minutes < 60) return { backgroundColor: '#FFEBAD' };
      if (minutes < 120) return { backgroundColor: '#FFE085' };
      if (minutes < 180) return { backgroundColor: '#FFD65C' };
      return { backgroundColor: '#FFCC33' };
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
       
       <div className="flex items-end justify-between mb-8">
         <div>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{labels.consistency}</h2>
            <p className="text-gray-500 font-medium mt-2">{labels.journey}</p>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="w-10 h-10 rounded-full bg-white dark:bg-white/10 shadow-card flex items-center justify-center hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-10 h-10 rounded-full bg-white dark:bg-white/10 shadow-card flex items-center justify-center hover:bg-gray-50 transition-colors"><ChevronRight size={20} /></button>
         </div>
       </div>

       {/* Heatmap Calendar Card */}
       <div className="bg-white dark:bg-[#2C2C2E] rounded-[2.5rem] p-8 shadow-card border border-gray-100 dark:border-white/5 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{format(currentDate, 'MMMM yyyy', { locale })}</span>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(d => <div key={d} className="text-center text-gray-400 text-xs font-bold uppercase tracking-wider">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
                {days.map(day => {
                    const isCurrentMonth = format(day, 'MM') === format(currentDate, 'MM');
                    const isToday = isSameDay(day, new Date());
                    const minutes = getTotalTimeForDay(day);
                    
                    // Base style for heat map
                    const intensityStyle = isCurrentMonth ? getIntensityStyle(minutes) : { opacity: 0.2 };
                    
                    // Conditional classes for Today vs Normal days
                    // Today: scale-[1.02] (very subtle), shadow-md, slightly thicker font
                    const todayClasses = isToday 
                        ? 'scale-[1.02] shadow-md z-10 font-bold bg-white dark:bg-[#3C3C3E]' 
                        : '';

                    // Determine text color: 
                    // Today: Adaptive Black/White
                    // Heatmap (minutes > 0): Always Dark (as bg is light yellow)
                    // Empty: Adaptive Gray
                    const textClass = isToday 
                        ? 'text-black dark:text-white' 
                        : minutes > 0 
                            ? 'text-[#111010]' 
                            : 'text-gray-700 dark:text-gray-300';

                    return (
                        <div 
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            style={isToday ? {} : intensityStyle} // Let active class handle today bg
                            className={`
                                relative rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
                                ${isToday ? '' : 'bg-gray-50 dark:bg-white/5'}
                                ${!isCurrentMonth ? 'pointer-events-none' : 'hover:scale-[1.05] hover:shadow-md hover:z-20'}
                                ${todayClasses}
                            `}
                        >
                            {/* Font size reduced to text-xs */}
                            <span className={`text-xs ${textClass}`}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    );
                })}
            </div>
       </div>

       {/* Modal for Daily Stats */}
       {selectedDate && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{format(selectedDate, 'MMMM do', { locale })}</h3>
                            <p className="text-gray-500 font-medium">{labels.dailyBreakdown}</p>
                        </div>
                        <button onClick={() => setSelectedDate(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200"><X size={20} /></button>
                    </div>

                    {/* Total Time & Pie Chart */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 dark:bg-black/20 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-[#FFF5D6] text-[#FFCC33] rounded-full flex items-center justify-center mb-4">
                                <Clock size={32} />
                            </div>
                            <h4 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                                {Math.floor(getTotalTimeForDay(selectedDate) / 60)}<span className="text-lg">h</span> {getTotalTimeForDay(selectedDate) % 60}<span className="text-lg">m</span>
                            </h4>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">{labels.totalFocus}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-black/20 rounded-[2rem] p-6 flex flex-col items-center">
                             <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 self-start">{labels.distribution}</h5>
                             <div className="w-full h-40">
                                 {getDailyStats(selectedDate).pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getDailyStats(selectedDate).pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={0} // Full Pie
                                                outerRadius={60}
                                                paddingAngle={0}
                                                dataKey="value"
                                            >
                                                {getDailyStats(selectedDate).pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                 ) : (
                                     <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">{labels.noData}</div>
                                 )}
                             </div>
                        </div>
                    </div>

                    {/* Goal Increments */}
                    <div className="mb-8">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{labels.impact}</h4>
                        <div className="space-y-3">
                            {Object.entries(getDailyStats(selectedDate).goalIncrements).length > 0 ? (
                                Object.entries(getDailyStats(selectedDate).goalIncrements).map(([goalTitle, increment]) => (
                                    <div key={goalTitle} className="flex items-center justify-between bg-warm-bg dark:bg-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="font-bold text-gray-800 dark:text-white">{goalTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-sm">
                                            <ArrowRight size={14} className="-rotate-45" />
                                            +{Math.round(increment)}%
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm">{labels.noProgress}</p>
                            )}
                        </div>
                    </div>

                    {/* Journal Entry (Simplified) */}
                    <div className="border-t border-gray-100 dark:border-white/10 pt-6">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{labels.note}</label>
                        {(() => {
                             const log = logs.find(l => l.date === format(selectedDate, 'yyyy-MM-dd')) || { date: format(selectedDate, 'yyyy-MM-dd') };
                             return (
                                 <textarea 
                                    className="w-full h-24 bg-gray-50 dark:bg-black/20 rounded-2xl p-4 font-medium text-gray-800 dark:text-white focus:outline-none resize-none"
                                    placeholder={labels.placeholder}
                                    value={log.journal || ''}
                                    onChange={(e) => onSaveLog({ ...log, journal: e.target.value })}
                                 />
                             )
                         })()}
                    </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default CalendarView;