interface Project {
    name: string;
    description?: string;
    color?: CtColor;
    icon?: FAIcon;
    id: number;
    shorty: string;
    securityLevelId: number;
    customModuleId: number;
    allowedUsers?: number[];
    readOnlyUsers?: number[];
}
interface TaskList {
    type: 'list';
    name: string;
    sortKey: number;
    isCollapsed?: boolean;
    showSubTasks?: boolean;
    showCompleted?: boolean;
    isDefault?: boolean;
}
interface Task {
    type: 'task';
    fullfilled: boolean;
    name: string;
    description?: string;
    url?: string;
    dueDate?: string;
    dueDateRelative?: number;
    allDay?: boolean;
    activity?: ActivityEntry[];
    sortKey: number;
    list?: number;
    tags?: number[];
    assignedTo?: number[];
    subTasks?: number[];
    comments?: ActivityEntry[];
    status?: 'open' | 'in-progress' | 'blocked' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    recurrencePattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    recurrenceLastCreated?: string;
    reminderMinutes?: number;
    attachments?: Attachment[];
    checklist?: ChecklistItem[];
    timeEstimate?: number;
    timeSpent?: number;
    canViewUsers?: number[];
    canEditUsers?: number[];
}

interface Attachment {
    id: string;
    name: string;
    url: string;
    uploadedBy?: number;
    uploadedAt?: string;
}

interface ChecklistItem {
    id: string;
    title: string;
    completed: boolean;
}
interface Tag {
    type: 'tag';
    name: string;
    color: string;
    sortKey: number;
}
interface ActivityEntry {
    personId: number;
    date: string;
    type: 'create' | 'fullfilled' | 'comment' | 'update';
    value?: any;
}

type TransformedTag = Tag & { id: number; dataCategoryId: number };
type TransformedTask = Task & { id: number; dataCategoryId: number };
type TransformedList = TaskList & {
    id: number;
    dataCategoryId: number;
    items?: TransformedTask[];
};
