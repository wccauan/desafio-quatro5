export interface User {
    id: number;
    name: string;
    role: string;
  }
  
  export type TaskStatus = 'A Fazer' | 'Em Andamento' | 'Concluído';
  export type TaskPriority = 'Alta' | 'Média' | 'Baixa';
  
  export interface Task {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    due_date: string;
    user_id: number | null;
    priority?: TaskPriority;
    users?: User;
  }
  
  export interface NewTask {
    title: string;
    description: string;
    status: TaskStatus;
    due_date: string;
    user_id: number | null;
    priority: TaskPriority;
  }