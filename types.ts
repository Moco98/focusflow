
export type Period = 'day' | 'week' | 'month';
export type TaskType = 'time' | 'count';

export interface UserProfile {
  name: string;
  avatar: string; // URL (blob) or Emoji string
  language: 'en' | 'zh';
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  tasks: Task[];
  color?: string; // Theme ID (e.g., 'clean', 'warm', 'rose')
}

export interface Task {
  id: string;
  parentId: string;
  title: string;
  type: TaskType;
  
  // For Time-based tasks
  targetDurationMinutes?: number;
  period?: Period;
  
  // For Count-based tasks
  subtasks: Subtask[];
  
  // Tracking
  isCompleted: boolean;
  completedAt?: number;
}

export interface Subtask {
  id: string;
  parentId: string; // Refers to Task ID
  title: string;
  isCompleted: boolean;
  completedAt?: number;
  totalTimeSpent: number; // in minutes
}

export interface FocusSession {
  id: string;
  taskId: string;
  subtaskId?: string; // Optional, if focused on a specific subtask
  goalId: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  note?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'awful';
  journal?: string;
}

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  timeLeft: number; // seconds
  mode: 'focus' | 'shortBreak' | 'longBreak';
  activeTaskId: string | null;
  activeSubtaskId: string | null;
  bgmBvid: string; // Bilibili BV ID
}
