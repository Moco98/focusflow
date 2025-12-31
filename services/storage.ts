
import { Goal, FocusSession, DailyLog, Task, Subtask } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Updated keys to force a data reset for the user
const GOALS_KEY = 'focusflow_goals_v2';
const SESSIONS_KEY = 'focusflow_sessions_v2';
const LOGS_KEY = 'focusflow_logs_v2';

// Mock Data Generator - Fresh Start (Day 1)
const generateMockData = () => {
  const now = Date.now();
  
  const goals: Goal[] = [
    {
      id: uuidv4(),
      title: 'Learn Full Stack Development',
      description: 'Master React, Node, and Databases',
      createdAt: now, // Created "Today"
      color: 'calm',
      tasks: [
        {
          id: uuidv4(),
          parentId: '', 
          title: 'Daily Coding Practice',
          type: 'time',
          targetDurationMinutes: 60,
          period: 'day',
          subtasks: [],
          isCompleted: false, // Not started
        },
        {
          id: uuidv4(),
          parentId: '',
          title: 'Build Portfolio Projects',
          type: 'count',
          subtasks: [
            { id: uuidv4(), parentId: '', title: 'E-commerce App', isCompleted: false, totalTimeSpent: 0 },
            { id: uuidv4(), parentId: '', title: 'Task Manager', isCompleted: false, totalTimeSpent: 0 },
            { id: uuidv4(), parentId: '', title: 'Blog Platform', isCompleted: false, totalTimeSpent: 0 },
          ],
          isCompleted: false, // Not started
        }
      ]
    },
    {
      id: uuidv4(),
      title: 'Fitness & Health',
      createdAt: now,
      color: 'fresh',
      tasks: [
        {
          id: uuidv4(),
          parentId: '',
          title: 'Weekly Gym Sessions',
          type: 'time',
          targetDurationMinutes: 300, // 5 hours
          period: 'week',
          subtasks: [],
          isCompleted: false, // Not started
        }
      ]
    }
  ];

  // Fix parentIds after generation
  goals.forEach(g => {
    g.tasks.forEach(t => {
      t.parentId = g.id;
      t.subtasks.forEach(s => s.parentId = t.id);
    });
  });

  return goals;
};

// Generate Mock Sessions - Empty for a fresh start
const generateMockSessions = (goals: Goal[]): FocusSession[] => {
  // Return empty array to signify no previous data
  return [];
};

export const loadGoals = (): Goal[] => {
  const stored = localStorage.getItem(GOALS_KEY);
  if (stored) return JSON.parse(stored);
  const defaults = generateMockData();
  saveGoals(defaults);
  return defaults;
};

export const saveGoals = (goals: Goal[]) => {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

export const loadSessions = (): FocusSession[] => {
  const stored = localStorage.getItem(SESSIONS_KEY);
  if (stored) return JSON.parse(stored);
  // Pass goals in case we ever want to generate data linked to them, 
  // but currently it returns empty []
  const goals = loadGoals(); 
  const defaults = generateMockSessions(goals);
  saveSessions(defaults);
  return defaults;
};

export const saveSessions = (sessions: FocusSession[]) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const loadLogs = (): DailyLog[] => {
  const stored = localStorage.getItem(LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveLogs = (logs: DailyLog[]) => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};
