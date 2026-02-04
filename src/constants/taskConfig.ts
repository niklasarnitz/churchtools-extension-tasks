import { t } from '@churchtools/utils';

/**
 * Zentrale Konfiguration für Task-Optionen (Status, Priorität, Wiederholung, Erinnerungen)
 * Diese Datei verhindert Duplikation dieser Optionen über mehrere Komponenten hinweg
 */

// Status-Konfiguration
export const TASK_STATUSES = [
    { id: 'open', label: 'tasks.status.open', icon: 'fas fa-circle', color: '#e5e7eb' },
    { id: 'in-progress', label: 'tasks.status.in-progress', icon: 'fas fa-circle', color: '#fbbf24' },
    { id: 'blocked', label: 'tasks.status.blocked', icon: 'fas fa-circle', color: '#ef4444' },
    { id: 'done', label: 'tasks.status.done', icon: 'fas fa-circle', color: '#10b981' },
] as const;

export const TASK_STATUS_OPTIONS = TASK_STATUSES.map(s => ({ id: s.id, label: s.label }));
export const STATUS_BADGE_COLORS: Record<string, string> = {
    open: '#e5e7eb',
    'in-progress': '#fbbf24',
    blocked: '#ef4444',
    done: '#10b981',
};

// Prioritäts-Konfiguration
export const TASK_PRIORITIES = [
    { id: 'critical', label: 'tasks.priority.critical', icon: 'fas fa-circle', color: '#7c2d12' },
    { id: 'high', label: 'tasks.priority.high', icon: 'fas fa-circle', color: '#ef4444' },
    { id: 'medium', label: 'tasks.priority.medium', icon: 'fas fa-circle', color: '#f59e0b' },
    { id: 'low', label: 'tasks.priority.low', icon: 'fas fa-circle', color: '#9ca3af' },
] as const;

export const TASK_PRIORITY_OPTIONS = TASK_PRIORITIES.map(p => ({ id: p.id, label: p.label }));
export const PRIORITY_BADGE_COLORS: Record<string, string> = {
    critical: '#7c2d12',
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#9ca3af',
};

// Wiederholungsmuster-Konfiguration
export const TASK_RECURRENCE_PATTERNS = [
    { id: 'daily', label: 'tasks.recurrence.daily' },
    { id: 'weekly', label: 'tasks.recurrence.weekly' },
    { id: 'biweekly', label: 'tasks.recurrence.biweekly' },
    { id: 'monthly', label: 'tasks.recurrence.monthly' },
    { id: 'yearly', label: 'tasks.recurrence.yearly' },
] as const;

// Erinnerungs-Optionen (in Minuten)
export const TASK_REMINDER_OPTIONS = [
    { id: 0, label: 'tasks.reminder.none' },
    { id: 15, label: 'tasks.reminder.15min' },
    { id: 60, label: 'tasks.reminder.1hour' },
    { id: 1440, label: 'tasks.reminder.1day' },
    { id: 2880, label: 'tasks.reminder.2days' },
    { id: 10080, label: 'tasks.reminder.1week' },
] as const;

// Helper-Funktionen zum Abrufen von Label-Objekten für SelectDropdown
export const getStatusOptions = () => TASK_STATUS_OPTIONS;
export const getPriorityOptions = () => TASK_PRIORITY_OPTIONS;
export const getRecurrenceOptions = () => TASK_RECURRENCE_PATTERNS;
export const getReminderOptions = () => TASK_REMINDER_OPTIONS;

// Helper-Funktion zum Abrufen einer Status- oder Priority-Config
export const getStatusConfig = (statusId: string | undefined) => {
    return TASK_STATUSES.find(s => s.id === statusId);
};

export const getPriorityConfig = (priorityId: string | undefined) => {
    return TASK_PRIORITIES.find(p => p.id === priorityId);
};

// Helper-Funktion zum Abrufen von i18n Keys für Labels
export const getStatusLabel = (statusId: string | undefined): string => {
    return getStatusConfig(statusId)?.label || '';
};

export const getPriorityLabel = (priorityId: string | undefined): string => {
    return getPriorityConfig(priorityId)?.label || '';
};

// Funktionen zum Abrufen von Optionen mit übersetzten Labels für SelectDropdown
export const getStatusOptionsWithTranslations = () => {
    return TASK_STATUS_OPTIONS.map(option => ({
        id: option.id,
        label: t(option.label),
    }));
};

export const getPriorityOptionsWithTranslations = () => {
    return TASK_PRIORITY_OPTIONS.map(option => ({
        id: option.id,
        label: t(option.label),
    }));
};

export const getRecurrenceOptionsWithTranslations = () => {
    return TASK_RECURRENCE_PATTERNS.map(option => ({
        id: option.id,
        label: t(option.label),
    }));
};

export const getReminderOptionsWithTranslations = () => {
    return TASK_REMINDER_OPTIONS.map(option => ({
        id: option.id,
        label: t(option.label),
    }));
};
