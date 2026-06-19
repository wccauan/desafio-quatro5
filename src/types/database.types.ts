export interface User {
    id: number;
    name: string;
    role: string;
  }
  
  export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'A Fazer' | 'Em Andamento' | 'Concluído';
    due_date: string;
    user_id: number;
    users?: User; 
  }