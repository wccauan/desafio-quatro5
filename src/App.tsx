import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Task } from './types/database.types';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, users(name)'); // Isso busca a tarefa e o nome do responsável

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
      } else {
        setTasks(data as Task[]);
      }
    }

    fetchTasks();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Atividades</h1>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 border rounded shadow">
            <h2 className="font-bold">{task.title}</h2>
            <p className="text-sm text-gray-600">{task.description}</p>
            <p className="text-xs mt-2">Responsável: {task.users?.name}</p>
            <p className="text-xs font-bold text-blue-600">Status: {task.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;