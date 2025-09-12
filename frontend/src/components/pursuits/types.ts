export interface Pursuit {
  id: string;
  title: string;
  description: string;
  stage: string;
  created: string;
  dueDate: string;
  assignee: string;
  assigneeInitials: string;
  is_submitted?: boolean;
  naicscode: string;
}

export interface Opportunity {
  title?: string;
  description?: string;
  due_date?: string;
}

export interface RfpSaveEventDetail {
  pursuitId: string;
  stage: string;
  percentage: number;
} 