
import React, { useState, useMemo } from 'react';
import { FocusSession, Goal, Task, UserProfile } from '../types';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Sector } from 'recharts';
import { 
  endOfWeek, endOfMonth, endOfYear, format, startOfWeek, startOfMonth, startOfYear, 
  isWithinInterval, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears 
} from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Clock, CheckCircle2, TrendingUp, Target, ChevronLeft, ChevronRight } from 'lucide-react';

interface StatisticsDashboardProps {
  sessions: FocusSession[];
  goals: Goal[];
  userProfile: UserProfile;
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ sessions, goals, userProfile }) => {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for interactive Pie Chart
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Localization setup
  const locale = userProfile.language === 'zh' ? zhCN : enUS;
  
  const t = {
      en: {
          week: 'Week',
          month: 'Month',
          year: 'Year',
          analytics: 'Analytics & Progress',
          totalFocus: 'Total Focus Time',
          goalsCompleted: 'Goals Completed',
          totalProgress: 'Total Progress',
          activeGoals: 'active goals',
          avgCompletion: 'Avg. completion status',
          uncompletedStatus: 'Uncompleted Goals Status',
          goalGrowth: 'Goal Growth',
          allDone: 'All goals completed!',
          noProgress: 'No progress recorded this',
          distribution: 'Focus Distribution',
          timeSpent: 'Time spent across goals',
          breakdown: 'Breakdown',
          noData: 'No data available',
          mins: 'mins',
          inPeriod: 'in this period'
      },
      zh: {
          week: '周',
          month: '月',
          year: '年',
          analytics: '统计与进度',
          totalFocus: '总专注时长',
          goalsCompleted: '已达成目标',
          totalProgress: '总进度',
          activeGoals: '个活跃目标',
          avgCompletion: '平均完成度',
          uncompletedStatus: '未完成目标状态',
          goalGrowth: '目标增长',
          allDone: '所有目标已完成！',
          noProgress: '本阶段无记录',
          distribution: '专注分布',
          timeSpent: '各目标投入时间',
          breakdown: '详细列表',
          noData: '暂无数据',
          mins: '分钟',
          inPeriod: '于此阶段'
      }
  };
  const labels = t[userProfile.language];
  
  const handlePrev = () => {
    if (range === 'week') setCurrentDate(prev => subWeeks(prev, 1));
    else if (range === 'month') setCurrentDate(prev => subMonths(prev, 1));
    else setCurrentDate(prev => subYears(prev, 1));
  };

  const handleNext = () => {
    if (range === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    else if (range === 'month') setCurrentDate(prev => addMonths(prev, 1));
    else setCurrentDate(prev => addYears(prev, 1));
  };

  const getDateLabel = () => {
    if (range === 'year') return format(currentDate, 'yyyy', { locale });
    if (range === 'month') return format(currentDate, 'MMMM yyyy', { locale });
    
    const start = startOfWeek(currentDate, { locale });
    const end = endOfWeek(currentDate, { locale });
    if (start.getFullYear() !== end.getFullYear()) {
        return `${format(start, 'MMM d, yyyy', { locale })} - ${format(end, 'MMM d, yyyy', { locale })}`;
    }
    return `${format(start, 'MMM d', { locale })} - ${format(end, 'MMM d, yyyy', { locale })}`;
  };

  // 3D Pie Chart Interaction Handlers
  const onPieClick = (_: any, index: number) => {
    setActiveIndex(prev => prev === index ? undefined : index);
  };

  // Custom Tooltip Component (Compact & Informative)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 pointer-events-none">
             <div className="flex flex-col">
                <span className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight mb-0.5">{data.name}</span>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                   {data.value} {labels.mins}
                </span>
            </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    
    // 1. Move Outward (Translate)
    const shift = 8; // Pixels to move out
    const mx = cx + shift * cos;
    const my = cy + shift * sin;

    return (
      <g>
        {/* Render the highlighted sector with Elevation (Shadow) & Scale */}
        <Sector
          cx={mx}
          cy={my}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6} // 2. Scale up (Elevate)
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
          // 3. 3D Shadow Effect
          style={{ filter: 'drop-shadow(4px 8px 12px rgba(0,0,0,0.3))' }} 
        />
      </g>
    );
  };

  // Calculate aggregated data based on range
  const data = useMemo(() => {
    let start: Date, end: Date;

    if (range === 'week') {
      start = startOfWeek(currentDate, { locale });
      end = endOfWeek(currentDate, { locale });
    } else if (range === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else {
      start = startOfYear(currentDate);
      end = endOfYear(currentDate);
    }

    const interval = { start, end };

    // Filter sessions within range
    const rangeSessions = sessions.filter(s => isWithinInterval(new Date(s.startTime), interval));
    
    // Total Time
    const totalTime = rangeSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    // Goal Comparison Data (Focus Time)
    const goalTimeComparison = goals.map(g => {
        const goalSessions = rangeSessions.filter(s => s.goalId === g.id);
        const minutes = goalSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
        return { name: g.title, value: minutes };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value); // Sort descending

    // Specific Metrics based on View (Year vs Week/Month)
    let completedGoalsCount = 0;
    let uncompletedGoalsProgress: { title: string, percent: number }[] = [];
    let goalIncrements: { title: string, increment: number, currentTotal: number }[] = [];
    
    if (range === 'year') {
        // YEAR VIEW LOGIC
        // 1. Completed Goals Count
        goals.forEach(g => {
            const allTasksCompleted = g.tasks.length > 0 && g.tasks.every(t => {
                if (t.type === 'count') {
                    return t.subtasks.every(s => s.isCompleted);
                } else {
                    return t.isCompleted; 
                }
            });
            if (allTasksCompleted) completedGoalsCount++;
            else {
                // 2. Uncompleted Goals Progress
                let p = 0;
                let count = 0;
                g.tasks.forEach(t => {
                    count++;
                    if (t.type === 'count' && t.subtasks.length > 0) {
                        p += (t.subtasks.filter(s => s.isCompleted).length / t.subtasks.length);
                    } else {
                        p += t.isCompleted ? 1 : 0;
                    }
                });
                uncompletedGoalsProgress.push({
                    title: g.title,
                    percent: count === 0 ? 0 : Math.round((p/count)*100)
                });
            }
        });
    } else {
        // WEEK / MONTH VIEW LOGIC
        // 1. Goal Progress Increments
        // Logic: How much progress happened IN THIS PERIOD?
        goals.forEach(g => {
            let incrementVal = 0; // 0 to 1 scale roughly
            let totalVal = 0; // 0 to 1 scale roughly
            let tasksCount = Math.max(g.tasks.length, 1);

            g.tasks.forEach(t => {
                if (t.type === 'time') {
                    // Time Task Increment based on accumulated duration in period vs target
                    const taskSessions = rangeSessions.filter(s => s.taskId === t.id);
                    const durationInPeriod = taskSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
                    
                    const allTaskSessions = sessions.filter(s => s.taskId === t.id);
                    const totalDuration = allTaskSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

                    const target = t.targetDurationMinutes || 60; // Default 60 if missing
                    
                    incrementVal += Math.min(1, durationInPeriod / target);
                    totalVal += Math.min(1, totalDuration / target);
                } else {
                    // Count Task Increment: Subtasks completed within this period
                    // Using completedAt
                    const completedInPeriod = t.subtasks.filter(s => s.isCompleted && s.completedAt && isWithinInterval(s.completedAt, interval)).length;
                    const totalCompleted = t.subtasks.filter(s => s.isCompleted).length;
                    const subCount = Math.max(t.subtasks.length, 1);

                    incrementVal += (completedInPeriod / subCount);
                    totalVal += (totalCompleted / subCount);
                }
            });

            const incrementPercent = Math.round((incrementVal / tasksCount) * 100);
            const totalPercent = Math.round((totalVal / tasksCount) * 100);

            if (incrementPercent > 0 || totalPercent > 0) {
                goalIncrements.push({
                    title: g.title,
                    increment: incrementPercent,
                    currentTotal: totalPercent
                });
            }
        });
    }

    return { 
        totalTime, 
        rangeSessions, 
        goalTimeComparison,
        completedGoalsCount,
        uncompletedGoalsProgress,
        goalIncrements
    };

  }, [sessions, goals, range, currentDate, locale]);

  const COLORS = ['#FBBF24', '#3B82F6', '#10B981', '#F472B6', '#8B5CF6', '#EF4444', '#8B5CF6'];

  return (
    <div className="h-full flex flex-col p-8 overflow-hidden">
      
      {/* Header with Range Toggle */}
      <div className="flex items-end justify-between mb-8 flex-shrink-0">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <button 
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                    <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white select-none">
                    {getDateLabel()}
                </h2>
                <button 
                    onClick={handleNext}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                    <ChevronRight size={18} className="text-gray-600 dark:text-gray-300" />
                </button>
            </div>
            <p className="text-gray-500 font-medium ml-1">{labels.analytics}</p>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-full p-1 flex shadow-card border border-gray-100 dark:border-white/5 h-fit">
            {['week', 'month', 'year'].map(r => (
                <button
                   key={r}
                   onClick={() => { setRange(r as any); setCurrentDate(new Date()); }}
                   className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${range === r ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {labels[r as keyof typeof labels] || r}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
         
         {/* Top Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Total Focus Time Card */}
             <div className="bg-warm-accent rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4 text-warm-brown/80">
                          <Clock size={24} />
                          <span className="font-bold uppercase text-xs tracking-wider">{labels.totalFocus}</span>
                      </div>
                      <h3 className="text-warm-brown text-6xl font-extrabold mb-1">
                          {Math.floor(data.totalTime / 60)}<span className="text-2xl">h</span>
                      </h3>
                      <p className="text-warm-brown/70 font-medium">{(data.totalTime % 60)} {labels.mins} {labels.inPeriod}</p>
                  </div>
             </div>

             {/* Secondary Metric Card based on View */}
             <div className="bg-white dark:bg-[#2C2C2E] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 flex flex-col justify-center">
                 {range === 'year' ? (
                     <>
                        <div className="flex items-center gap-3 mb-4 text-green-500">
                            <CheckCircle2 size={24} />
                            <span className="font-bold uppercase text-xs tracking-wider">{labels.goalsCompleted}</span>
                        </div>
                        <h3 className="text-gray-900 dark:text-white text-6xl font-extrabold mb-1">{data.completedGoalsCount}</h3>
                        <p className="text-gray-500 font-medium">out of {goals.length} {labels.activeGoals}</p>
                     </>
                 ) : (
                     <>
                        <div className="flex items-center gap-3 mb-4 text-blue-500">
                            <TrendingUp size={24} />
                            <span className="font-bold uppercase text-xs tracking-wider">{labels.totalProgress}</span>
                        </div>
                         {/* Average Total Progress of active goals */}
                         {(() => {
                            const activeTotals = data.goalIncrements.map(g => g.currentTotal);
                            const avgTotal = activeTotals.length ? Math.round(activeTotals.reduce((a,b)=>a+b,0)/activeTotals.length) : 0;
                            return (
                                <>
                                   <h3 className="text-gray-900 dark:text-white text-6xl font-extrabold mb-1">{avgTotal}%</h3>
                                   <p className="text-gray-500 font-medium">{labels.avgCompletion}</p>
                                </>
                            );
                         })()}
                     </>
                 )}
             </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Progress Bars */}
            <div className="bg-white dark:bg-[#2C2C2E] rounded-[2.5rem] p-8 shadow-card border border-gray-100 dark:border-white/5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    {range === 'year' ? labels.uncompletedStatus : labels.goalGrowth}
                </h3>
                
                <div className="space-y-6">
                    {range === 'year' ? (
                        data.uncompletedGoalsProgress.length > 0 ? (
                            data.uncompletedGoalsProgress.map(g => (
                                <div key={g.title}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{g.title}</span>
                                        <span className="font-bold text-gray-500">{g.percent}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-800 dark:bg-gray-200 rounded-full" style={{ width: `${g.percent}%` }}></div>
                                    </div>
                                </div>
                            ))
                        ) : <div className="text-gray-400 italic">{labels.allDone}</div>
                    ) : (
                        data.goalIncrements.length > 0 ? (
                            data.goalIncrements.map(g => (
                                <div key={g.title}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate pr-4">{g.title}</span>
                                        <div className="flex gap-2 text-xs font-bold">
                                            <span className="text-green-500">+{g.increment}%</span>
                                            <span className="text-gray-400">Total: {g.currentTotal}%</span>
                                        </div>
                                    </div>
                                    {/* Dual Progress Bar */}
                                    <div className="relative w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        {/* Existing Base (Gray) */}
                                        <div className="absolute top-0 left-0 h-full bg-gray-300 dark:bg-gray-600 rounded-full" style={{ width: `${g.currentTotal}%` }}></div>
                                        {/* Increment (Green) */}
                                        <div className="absolute top-0 h-full bg-green-500 rounded-full" style={{ left: `${Math.max(0, g.currentTotal - g.increment)}%`, width: `${g.increment}%` }}></div>
                                    </div>
                                </div>
                            ))
                        ) : <div className="text-gray-400 italic">{labels.noProgress} {range}.</div>
                    )}
                </div>
            </div>

            {/* Right Column: Focus Distribution (Pie Chart & List) */}
            <div className="bg-white dark:bg-[#2C2C2E] rounded-[2.5rem] p-8 shadow-card border border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-6">
                
                {/* Chart Section */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{labels.distribution}</h3>
                    <p className="text-gray-400 text-sm font-medium mb-6">{labels.timeSpent}</p>
                    
                    <div className="flex-1 min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.goalTimeComparison}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={70}
                                    paddingAngle={0}
                                    dataKey="value"
                                    // Interactive Props
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    onClick={onPieClick}
                                    cursor="pointer"
                                >
                                    {data.goalTimeComparison.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <ReTooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Legend & List Section - Removed Border */}
                <div className="flex-1 flex flex-col justify-center pt-6 md:pt-0 md:pl-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">{labels.breakdown}</h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {data.goalTimeComparison.length > 0 ? (
                            data.goalTimeComparison.map((entry, index) => (
                                <div 
                                    key={entry.name} 
                                    className={`flex items-center justify-between group cursor-pointer p-2 rounded-xl transition-colors ${activeIndex === index ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    onClick={() => setActiveIndex(prev => prev === index ? undefined : index)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className={`text-sm font-bold truncate ${activeIndex === index ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{entry.name}</span>
                                    </div>
                                    <div className="text-xs font-bold bg-white dark:bg-black/20 px-2 py-1 rounded-md text-gray-500 dark:text-gray-400">
                                        {entry.value}m
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 text-sm italic">{labels.noData}</div>
                        )}
                    </div>
                </div>
            </div>

         </div>

      </div>
    </div>
  );
};

export default StatisticsDashboard;
