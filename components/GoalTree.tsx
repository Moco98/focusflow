
import React, { useState } from 'react';
import { Goal, Task, Subtask, UserProfile } from '../types';
import { Plus, Timer, Trash2, Clock, CheckCircle2, ChevronRight, ArrowLeft, Settings, Pencil, Check, X } from 'lucide-react';

interface GoalTreeProps {
  goals: Goal[];
  userProfile: UserProfile;
  onStartFocus: (taskId: string, subtaskId?: string) => void;
  onAddGoal: (title: string, color?: string) => void;
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
  onAddTask: (goalId: string, task: Omit<Task, 'id' | 'parentId' | 'subtasks' | 'isCompleted' | 'logs'>) => void;
  onUpdateTask: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (goalId: string, taskId: string) => void;
  onAddSubtask: (goalId: string, taskId: string, title: string) => void;
  onUpdateSubtask: (goalId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  onDeleteSubtask: (goalId: string, taskId: string, subtaskId: string) => void;
  onDeleteGoal: (id: string) => void;
  onToggleSubtask: (goalId: string, taskId: string, subtaskId: string) => void;
}

// Warm Minimalist Color Palette (Backgrounds & Matching Accents)
const COLOR_THEMES: Record<string, { bgLight: string, bgDark: string, accentLight: string, accentDark: string }> = {
    'clean': { bgLight: '#FAFAF9', bgDark: '#1E1E1E', accentLight: '#111010', accentDark: '#FFFFFF' }, // Default Stone
    'warm':  { bgLight: '#FFFBEB', bgDark: '#451a03', accentLight: '#D97706', accentDark: '#FCD34D' }, // Amber
    'rose':  { bgLight: '#FDF2F8', bgDark: '#500724', accentLight: '#DB2777', accentDark: '#F9A8D4' }, // Pink
    'fresh': { bgLight: '#ECFDF5', bgDark: '#064e3b', accentLight: '#059669', accentDark: '#6EE7B7' }, // Emerald
    'calm':  { bgLight: '#EFF6FF', bgDark: '#172554', accentLight: '#2563EB', accentDark: '#93C5FD' }, // Blue
    'stone': { bgLight: '#F5F5F4', bgDark: '#292524', accentLight: '#57534E', accentDark: '#D6D3D1' }, // Stone
};

const GoalTree: React.FC<GoalTreeProps> = ({ 
  goals, userProfile, onStartFocus, onAddGoal, onUpdateGoal, onAddTask, onUpdateTask, onDeleteTask, onAddSubtask, onUpdateSubtask, onDeleteSubtask, onDeleteGoal, onToggleSubtask 
}) => {
  // Navigation & Selection
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  
  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Goal Input State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalColor, setGoalColor] = useState('clean');
  
  // Task Inputs
  const [addingTaskTo, setAddingTaskTo] = useState<string | null>(null); // Goal ID
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // Task ID if editing
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'time' | 'count'>('time');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [newTaskPeriod, setNewTaskPeriod] = useState<'day' | 'week' | 'month'>('day');

  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null); // Task ID
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Subtask Inline Editing
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');

  // Task Expansion in Detail View
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const activeGoal = goals.find(g => g.id === selectedGoalId);

  // i18n
  const t = {
      en: {
          hi: 'Hi',
          ready: 'Ready to focus?',
          quickAccess: 'Quick Access',
          createGoal: 'Create Goal',
          editGoal: 'Edit Goal',
          addNew: 'Add New Goal',
          tasks: 'tasks',
          done: 'Done',
          newTask: 'New Task',
          editTask: 'Edit Task',
          noTasks: 'No tasks yet',
          startAdding: 'Start by adding your first task above.',
          minutes: 'MINUTES',
          repeat: 'REPEAT',
          cancel: 'Cancel',
          add: 'Add',
          save: 'Save Changes',
          delete: 'Delete Task',
          selectColor: 'Select Color'
      },
      zh: {
          hi: '你好',
          ready: '准备好专注了吗？',
          quickAccess: '快速访问',
          createGoal: '新建目标',
          editGoal: '编辑目标',
          addNew: '添加新目标',
          tasks: '个任务',
          done: '完成',
          newTask: '新任务',
          editTask: '编辑任务',
          noTasks: '暂无任务',
          startAdding: '点击上方添加你的第一个任务。',
          minutes: '分钟',
          repeat: '重复',
          cancel: '取消',
          add: '添加',
          save: '保存修改',
          delete: '删除任务',
          selectColor: '选择颜色'
      }
  };
  const labels = t[userProfile.language];

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
      setGoalTitle('');
      setGoalColor('clean');
      setShowGoalModal(true);
  };

  const openEditModal = () => {
      if (activeGoal) {
          setGoalTitle(activeGoal.title);
          setGoalColor(activeGoal.color || 'clean');
          setShowEditModal(true);
      }
  };

  const handleAddGoal = () => {
    if (goalTitle.trim()) {
      onAddGoal(goalTitle, goalColor);
      setShowGoalModal(false);
    }
  };

  const handleUpdateGoal = () => {
      if (activeGoal && goalTitle.trim()) {
          onUpdateGoal(activeGoal.id, { title: goalTitle, color: goalColor });
          setShowEditModal(false);
      }
  };

  const openAddTaskModal = (goalId: string) => {
    setAddingTaskTo(goalId);
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskType('time');
    setNewTaskDuration(60);
    setNewTaskPeriod('day');
  };

  const openEditTaskModal = (goalId: string, task: Task) => {
    setAddingTaskTo(goalId);
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskType(task.type);
    setNewTaskDuration(task.targetDurationMinutes || 60);
    setNewTaskPeriod(task.period || 'day');
  };

  const handleTaskSubmit = () => {
    if (addingTaskTo && newTaskTitle.trim()) {
      if (editingTaskId) {
        // Update
        onUpdateTask(addingTaskTo, editingTaskId, {
          title: newTaskTitle,
          type: newTaskType,
          targetDurationMinutes: newTaskType === 'time' ? newTaskDuration : undefined,
          period: newTaskType === 'time' ? newTaskPeriod : undefined,
        });
      } else {
        // Add
        onAddTask(addingTaskTo, {
          title: newTaskTitle,
          type: newTaskType,
          targetDurationMinutes: newTaskType === 'time' ? newTaskDuration : undefined,
          period: newTaskType === 'time' ? newTaskPeriod : undefined,
        });
      }
      setAddingTaskTo(null);
      setEditingTaskId(null);
    }
  };

  const handleDeleteTaskAction = () => {
      if (addingTaskTo && editingTaskId) {
          if (confirm('Are you sure you want to delete this task?')) {
              onDeleteTask(addingTaskTo, editingTaskId);
              setAddingTaskTo(null);
              setEditingTaskId(null);
          }
      }
  }

  const handleAddSubtask = () => {
    if (addingSubtaskTo && newSubtaskTitle.trim()) {
      const goalId = goals.find(g => g.tasks.some(t => t.id === addingSubtaskTo))?.id;
      if (goalId) {
        onAddSubtask(goalId, addingSubtaskTo, newSubtaskTitle);
        setAddingSubtaskTo(null);
        setNewSubtaskTitle('');
        setExpandedTasks(prev => ({...prev, [addingSubtaskTo]: true}));
      }
    }
  };

  const startEditingSubtask = (sub: Subtask) => {
      setEditingSubtaskId(sub.id);
      setEditSubtaskTitle(sub.title);
  };

  const saveSubtaskEdit = (goalId: string, taskId: string) => {
      if (editingSubtaskId && editSubtaskTitle.trim()) {
          onUpdateSubtask(goalId, taskId, editingSubtaskId, { title: editSubtaskTitle });
          setEditingSubtaskId(null);
      }
  };

  const getGoalProgress = (goal: Goal) => {
    if (goal.tasks.length === 0) return 0;
    let totalProgress = 0;
    goal.tasks.forEach(t => {
      if (t.type === 'count') {
        if (t.subtasks.length === 0) {
            totalProgress += 0;
        } else {
            const done = t.subtasks.filter(s => s.isCompleted).length;
            totalProgress += (done / t.subtasks.length);
        }
      } else {
        // Time based task logic
        const target = t.targetDurationMinutes || 60;
        const current = t.totalTimeSpent || 0;
        // Cap progress at 1 (100%) for calculation, even if user exceeds time
        totalProgress += Math.min(1, current / target);
      }
    });
    return Math.round((totalProgress / Math.max(goal.tasks.length, 1)) * 100);
  };

  // ----------------------------------------------------------------------
  // Circular Progress Component (Scalable SVG)
  // ----------------------------------------------------------------------
  const CircularProgress = ({ percentage, color, trackColor }: { percentage: number, color: string, trackColor: string }) => {
    const strokeWidth = 6;
    const radius = 46; 
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-full h-full p-2">
        <svg
          viewBox="0 0 100 100"
          className="transform -rotate-90 w-full h-full"
          style={{ overflow: 'visible' }}
        >
           {/* Track */}
          <circle
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          {/* Progress */}
          <circle
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span 
                className="text-4xl font-bold tracking-tighter"
                style={{ color }}
             >
                {percentage}%
             </span>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------------
  // Render: Goal Grid View
  // ----------------------------------------------------------------------
  if (!selectedGoalId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 px-8 pt-8 flex-shrink-0">
          <div>
            <h2 className="text-4xl font-extrabold text-brand-noir dark:text-white tracking-tight">{labels.hi}, {userProfile.name}</h2>
            <div className="flex items-center gap-2 mt-2 text-warm-subtext">
                <span className="w-2 h-2 rounded-full bg-brand-soleil"></span>
                <p className="font-medium">{labels.ready}</p>
            </div>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-brand-noir dark:bg-white text-white dark:text-brand-noir px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 font-bold text-sm shadow-lg"
          >
            {labels.createGoal} <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-20 custom-scrollbar">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">{labels.quickAccess}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {goals.map((goal) => {
                    const progress = getGoalProgress(goal);
                    const themeId = goal.color && COLOR_THEMES[goal.color] ? goal.color : 'clean';
                    const theme = COLOR_THEMES[themeId];

                    return (
                        <div 
                            key={goal.id} 
                            onClick={() => setSelectedGoalId(goal.id)}
                            className="flex flex-col gap-3 group cursor-pointer"
                        >
                            {/* Card Container */}
                            <div 
                                className="w-full aspect-square rounded-[2.5rem] relative overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-md p-4 border border-gray-100 dark:border-white/5"
                                style={{ backgroundColor: theme.bgLight }}
                            >
                                {/* Hover Delete */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
                                    className="absolute top-4 right-4 p-2 bg-white/20 text-gray-500 hover:text-red-500 hover:bg-white/50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-30 backdrop-blur-sm"
                                >
                                    <Trash2 size={14} />
                                </button>

                                {/* Circular Progress Bar */}
                                <CircularProgress 
                                    percentage={progress} 
                                    color={theme.accentLight} 
                                    trackColor="rgba(0,0,0,0.05)"
                                />
                                
                            </div>

                            {/* Title Outside Card */}
                            <div className="text-center px-1">
                                <h3 className="text-lg font-bold text-warm-text dark:text-white leading-tight mb-1 truncate">{goal.title}</h3>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{goal.tasks.length} {labels.tasks}</p>
                            </div>
                        </div>
                    );
                })}

                {/* Add New Goal Button */}
                <div 
                    onClick={openCreateModal}
                    className="flex flex-col gap-3 group cursor-pointer"
                >
                    <div className="w-full aspect-square rounded-[2.5rem] bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center transition-colors group-hover:border-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-white/10">
                        <div className="w-14 h-14 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-gray-400 group-hover:bg-brand-noir group-hover:text-white transition-all duration-300">
                            <Plus size={28} />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{labels.addNew}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Create Goal Modal */}
        {showGoalModal && (
        <div className="fixed inset-0 bg-brand-noir/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-bold mb-2 text-brand-noir dark:text-white">{labels.createGoal}</h3>
              
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl mb-6 mt-6">
                <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-lg font-semibold text-brand-noir dark:text-white placeholder:text-gray-300" 
                    placeholder="e.g. Learn Piano"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                />
              </div>

              {/* Color Selection */}
              <div className="mb-8">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">{labels.selectColor}</label>
                  <div className="flex justify-between">
                      {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                          <button
                            key={key}
                            onClick={() => setGoalColor(key)}
                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${goalColor === key ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: theme.bgLight }}
                          >
                            {goalColor === key && <div className="w-full h-full flex items-center justify-center text-black/50"><CheckCircle2 size={16} /></div>}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowGoalModal(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">{labels.cancel}</button>
                <button onClick={handleAddGoal} className="flex-1 py-3 bg-brand-noir dark:bg-white text-white dark:text-brand-noir rounded-xl hover:scale-105 active:scale-95 transition-all font-bold shadow-lg">{labels.add}</button>
              </div>
          </div>
        </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // Render: Goal Detail View
  // ----------------------------------------------------------------------
  if (activeGoal) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 mb-8 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSelectedGoalId(null)}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-700 dark:text-white" />
                </button>
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-extrabold text-brand-noir dark:text-white truncate max-w-md">{activeGoal.title}</h2>
                    <button 
                        onClick={openEditModal}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
            <button 
                onClick={() => openAddTaskModal(activeGoal.id)}
                className="bg-brand-noir dark:bg-white text-white dark:text-brand-noir px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center gap-2 flex-shrink-0"
            >
                <Plus size={16} /> {labels.newTask}
            </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
          <div className="space-y-4">
            {activeGoal.tasks.length === 0 ? (
              <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-10 text-center border border-dashed border-gray-200 dark:border-white/10">
                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Clock size={32} className="text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-600 dark:text-gray-300">{labels.noTasks}</h3>
                <p className="text-gray-400 text-sm mt-1">{labels.startAdding}</p>
              </div>
            ) : (
              activeGoal.tasks.map(task => {
                const themeId = activeGoal.color && COLOR_THEMES[activeGoal.color] ? activeGoal.color : 'clean';
                const theme = COLOR_THEMES[themeId];
                
                return (
                <div key={task.id} className="bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/5 rounded-3xl p-1 shadow-card hover:shadow-lg transition-shadow">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 cursor-pointer overflow-hidden" onClick={() => toggleTask(task.id)}>
                        <div 
                            className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: `${theme.bgLight}`, color: theme.accentLight }}
                        >
                            {task.type === 'time' ? <Timer size={20} strokeWidth={2.5} /> : <CheckCircle2 size={20} strokeWidth={2.5} />}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-brand-noir dark:text-white text-lg truncate">{task.title}</h4>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                {task.type === 'time' 
                                  ? `${task.totalTimeSpent || 0} / ${task.targetDurationMinutes}m • ${task.period}` 
                                  : `${task.subtasks.filter(s => s.isCompleted).length} / ${task.subtasks.length} items`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pr-2 flex-shrink-0">
                        {/* Task Edit Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); openEditTaskModal(activeGoal.id, task); }}
                            className="w-8 h-8 rounded-full text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <Pencil size={16} />
                        </button>

                        {task.type === 'time' ? (
                            <button
                                onClick={() => onStartFocus(task.id)}
                                className="bg-brand-noir dark:bg-white text-white dark:text-brand-noir px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                            >
                                Start
                            </button>
                        ) : (
                            <button
                                onClick={() => setAddingSubtaskTo(task.id)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                         <button 
                            onClick={() => toggleTask(task.id)}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                         >
                            <ChevronRight size={18} className={`text-gray-400 transition-transform ${expandedTasks[task.id] ? 'rotate-90' : ''}`} />
                         </button>
                    </div>
                  </div>

                  {/* Expanded Subtasks */}
                  {task.type === 'count' && expandedTasks[task.id] && (
                    <div className="px-4 pb-4 pt-0">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-2 space-y-1">
                            {task.subtasks.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-colors group">
                                    <div className="flex items-center gap-3 cursor-pointer flex-1">
                                        <div onClick={() => onToggleSubtask(activeGoal.id, task.id, sub.id)}>
                                            {sub.isCompleted ? (
                                                <div 
                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                                                    style={{ backgroundColor: theme.accentLight }}
                                                >
                                                    <CheckCircle2 size={12} />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                            )}
                                        </div>

                                        {/* Inline Editing for Subtask */}
                                        {editingSubtaskId === sub.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input 
                                                    type="text" 
                                                    value={editSubtaskTitle}
                                                    onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveSubtaskEdit(activeGoal.id, task.id)}
                                                    className="bg-white dark:bg-black/30 px-2 py-1 rounded-md text-sm font-medium outline-none flex-1 border border-brand-soleil"
                                                    autoFocus
                                                />
                                                <button onClick={() => saveSubtaskEdit(activeGoal.id, task.id)} className="text-green-500 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
                                                <button onClick={() => setEditingSubtaskId(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={14}/></button>
                                            </div>
                                        ) : (
                                            <span 
                                                className={`font-medium ${sub.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
                                                onClick={() => onToggleSubtask(activeGoal.id, task.id, sub.id)}
                                            >
                                                {sub.title}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {editingSubtaskId !== sub.id && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditingSubtask(sub)}
                                                className="p-2 text-gray-400 hover:text-brand-noir dark:hover:text-white"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteSubtask(activeGoal.id, task.id, sub.id)}
                                                className="p-2 text-gray-400 hover:text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => onStartFocus(task.id, sub.id)}
                                                className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white bg-white dark:bg-black/40 px-2 py-1 rounded-md shadow-sm ml-1"
                                            >
                                                Focus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {task.subtasks.length === 0 && <div className="p-3 text-center text-xs text-gray-400 font-medium">{labels.noTasks}</div>}
                        </div>
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
        
        {/* Modals for Task Adding/Editing */}
        {(addingTaskTo || addingSubtaskTo) && (
        <div className="fixed inset-0 bg-brand-noir/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in fade-in zoom-in duration-200">
             {addingTaskTo && (
               <>
                 <h3 className="text-2xl font-bold mb-6 text-brand-noir dark:text-white">
                     {editingTaskId ? labels.editTask : labels.newTask}
                 </h3>
                 <div className="space-y-5">
                   <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Title</label>
                     <input 
                       type="text" 
                       autoFocus
                       className="w-full bg-transparent outline-none font-bold text-brand-noir dark:text-white" 
                       placeholder="e.g. Read 10 pages"
                       value={newTaskTitle}
                       onChange={(e) => setNewTaskTitle(e.target.value)}
                     />
                   </div>
                   
                   <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                     {(['time', 'count'] as const).map(type => (
                       <button 
                         key={type}
                         onClick={() => setNewTaskType(type)}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${newTaskType === type ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-noir dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                       >
                         {type}
                       </button>
                     ))}
                   </div>
   
                   {newTaskType === 'time' && (
                     <div className="flex gap-4">
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                           <label className="block text-xs font-bold text-gray-400 mb-1">{labels.minutes}</label>
                           <input 
                             type="number" 
                             value={newTaskDuration}
                             onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                             className="w-full bg-transparent outline-none font-bold text-brand-noir dark:text-white" 
                           />
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                           <label className="block text-xs font-bold text-gray-400 mb-1">{labels.repeat}</label>
                           <select 
                             value={newTaskPeriod}
                             onChange={(e) => setNewTaskPeriod(e.target.value as any)}
                             className="w-full bg-transparent outline-none font-bold text-brand-noir dark:text-white"
                           >
                             <option value="day">Daily</option>
                             <option value="week">Weekly</option>
                             <option value="month">Monthly</option>
                           </select>
                        </div>
                     </div>
                   )}
                 </div>
                 
                 <div className="flex gap-3 mt-8">
                   <button onClick={() => { setAddingTaskTo(null); setEditingTaskId(null); }} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">{labels.cancel}</button>
                   <button onClick={handleTaskSubmit} className="flex-1 py-3 bg-brand-noir dark:bg-white text-white dark:text-brand-noir rounded-xl font-bold shadow-lg">
                       {editingTaskId ? labels.save : labels.add}
                   </button>
                 </div>
                 
                 {editingTaskId && (
                     <div className="mt-4 border-t border-gray-100 dark:border-white/10 pt-4 text-center">
                         <button onClick={handleDeleteTaskAction} className="text-red-500 text-sm font-bold hover:text-red-600 flex items-center justify-center gap-2 w-full py-2">
                             <Trash2 size={16} /> {labels.delete}
                         </button>
                     </div>
                 )}
               </>
             )}

             {addingSubtaskTo && (
                <>
                 <h3 className="text-2xl font-bold mb-6 text-brand-noir dark:text-white">New Item</h3>
                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl mb-6">
                    <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-transparent outline-none font-bold text-brand-noir dark:text-white" 
                    placeholder="Item name..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    />
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => setAddingSubtaskTo(null)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">{labels.cancel}</button>
                   <button onClick={handleAddSubtask} className="flex-1 py-3 bg-brand-noir dark:bg-white text-white dark:text-brand-noir rounded-xl font-bold shadow-lg">{labels.add}</button>
                 </div>
                </>
             )}
          </div>
        </div>
        )}

        {/* Edit Goal Modal */}
        {showEditModal && (
        <div className="fixed inset-0 bg-brand-noir/20 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-bold mb-2 text-brand-noir dark:text-white">{labels.editGoal}</h3>
              
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl mb-6 mt-6">
                <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-lg font-semibold text-brand-noir dark:text-white placeholder:text-gray-300" 
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>

              {/* Color Selection */}
              <div className="mb-8">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">{labels.selectColor}</label>
                  <div className="flex justify-between">
                      {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                          <button
                            key={key}
                            onClick={() => setGoalColor(key)}
                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${goalColor === key ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: theme.bgLight }}
                          >
                            {goalColor === key && <div className="w-full h-full flex items-center justify-center text-black/50"><CheckCircle2 size={16} /></div>}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">{labels.cancel}</button>
                <button onClick={handleUpdateGoal} className="flex-1 py-3 bg-brand-noir dark:bg-white text-white dark:text-brand-noir rounded-xl hover:scale-105 active:scale-95 transition-all font-bold shadow-lg">{labels.save}</button>
              </div>
          </div>
        </div>
        )}

      </div>
    );
  }

  // Fallback
  return null;
};

export default GoalTree;