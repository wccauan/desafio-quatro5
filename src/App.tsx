import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';    
import { supabase } from './lib/supabase';
import type { Task, TaskStatus, TaskPriority, NewTask } from './types/database.types';

// ─── Constantes ────────────────────────────────────────────────────────────────

const COLUMNS: TaskStatus[] = ['A Fazer', 'Em Andamento', 'Concluído'];

const COLUMN_NEXT: Record<TaskStatus, TaskStatus | null> = {
  'A Fazer': 'Em Andamento',
  'Em Andamento': 'Concluído',
  'Concluído': null,
};

const COLUMN_PREV: Record<TaskStatus, TaskStatus | null> = {
  'A Fazer': null,
  'Em Andamento': 'A Fazer',
  'Concluído': 'Em Andamento',
};

const STATUS_STYLES: Record<TaskStatus, { badge: string; borderTop: string; dot: string }> = {
  'A Fazer':      { badge: 'bg-slate-100 text-slate-600',   borderTop: 'border-t-slate-400',   dot: 'bg-slate-400'   },
  'Em Andamento': { badge: 'bg-amber-100 text-amber-700',   borderTop: 'border-t-amber-400',   dot: 'bg-amber-400'   },
  'Concluído':    { badge: 'bg-emerald-100 text-emerald-700', borderTop: 'border-t-emerald-500', dot: 'bg-emerald-500' },
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Alta:  'bg-red-100 text-red-700',
  Média: 'bg-orange-100 text-orange-700',
  Baixa: 'bg-sky-100 text-sky-700',
};

const EMPTY_FORM: NewTask = {
  title: '',
  description: '',
  status: 'A Fazer',
  due_date: '',
  user_id: null,
  priority: 'Média',
};

const OWNER_ID = 1; // Ricardo — dono da empresa, excluído dos KPIs gerais

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(raw: string): string {
  if (!raw) return 'Sem prazo';           
  const parts = raw.split('-');
  if (parts.length < 3) return raw;       
  const [year, month, day] = parts;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');
}

function isOverdue(raw: string, status: TaskStatus): boolean {
  if (!raw || status === 'Concluído') return false;  // 👈 proteção contra null
  const parts = raw.split('-');
  if (parts.length < 3) return false;
  const [year, month, day] = parts;
  const due = new Date(Number(year), Number(month) - 1, Number(day));
  due.setHours(23, 59, 59);
  return due < new Date();
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent,
}: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <span className={`text-3xl font-extrabold ${accent ?? 'text-gray-900'}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task, onMove, moving,
}: {
  task: Task;
  onMove: (id: number, status: TaskStatus) => void;
  moving: boolean;
}) {
  const overdue = isOverdue(task.due_date, task.status);
  const next = COLUMN_NEXT[task.status];
  const prev = COLUMN_PREV[task.status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col gap-3">
      {/* Topo: prioridade + id */}
      <div className="flex items-center justify-between">
        {task.priority ? (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
        ) : <span />}
        <span className="text-[11px] text-gray-300 font-mono">#{task.id}</span>
      </div>

      {/* Título e descrição */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      {/* Responsável + prazo */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.users?.name ? (
            <>
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {getInitials(task.users.name)}
              </div>
              <span className="text-xs text-gray-600 truncate">{task.users.name}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">Não atribuído</span>
          )}
        </div>
        <span className={`text-xs font-medium shrink-0 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
          {overdue && '⚠ '}{formatDate(task.due_date)}
        </span>
      </div>

      {/* Botões de mover */}
      <div className="flex gap-2 pt-1">
        {prev && (
          <button
            disabled={moving}
            onClick={() => onMove(task.id, prev)}
            className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ← {prev}
          </button>
        )}
        {next && (
          <button
            disabled={moving}
            onClick={() => onMove(task.id, next)}
            className="flex-1 text-xs py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors font-medium"
          >
            {next} →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  status, tasks, onMove, movingId,
}: {
  status: TaskStatus;
  tasks: Task[];
  onMove: (id: number, status: TaskStatus) => void;
  movingId: number | null;
}) {
  const { badge, borderTop, dot } = STATUS_STYLES[status];

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      {/* Cabeçalho */}
      <div className={`bg-white rounded-xl border border-gray-200 border-t-4 ${borderTop} px-4 py-3 mb-3 flex items-center justify-between sticky top-4 z-10 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-sm font-semibold text-gray-800">{status}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">
            Nenhuma tarefa aqui
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onMove={onMove}
              moving={movingId === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Modal de Nova Tarefa ─────────────────────────────────────────────────────

function NewTaskModal({
  users,
  onClose,
  onSave,
  saving,
}: {
  users: { id: number; name: string }[];
  onClose: () => void;
  onSave: (data: NewTask) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NewTask>(EMPTY_FORM);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'user_id' ? (value === '' ? null : Number(value)) : value,
    }));
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.due_date) return;
    onSave(form);
  }

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '28rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Nova tarefa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Campos */}
        <div className="flex flex-col gap-4">
          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Título *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex: Revisar proposta do cliente"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Detalhes opcionais..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Responsável + Prioridade lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Responsável</label>
              <select
                name="user_id"
                value={form.user_id ?? ''}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Nenhum</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Prioridade</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Status + Prazo lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Status inicial</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Prazo *</label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim() || !form.due_date}
            className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando...' : 'Criar tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div key={col} className="flex flex-col min-w-[280px] flex-1 gap-3">
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ))}
    </div>
  );
}

// ─── App Principal ────────────────────────────────────────────────────────────

export default function App() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [users, setUsers]           = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [movingId, setMovingId]     = useState<number | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);

  // ── Fetch inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);

      const [{ data: tasksData, error: tasksError }, { data: usersData }] = await Promise.all([
        supabase.from('tasks').select('*, users(name)').order('due_date', { ascending: true }),
        supabase.from('users').select('id, name').order('name'),
      ]);

      if (tasksError) {
        setError('Não foi possível carregar as tarefas. Verifique sua conexão.');
      } else {
        setTasks(tasksData as Task[]);
        setUsers(usersData ?? []);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  // ── Mover tarefa entre colunas ─────────────────────────────────────────────
  async function handleMove(taskId: number, newStatus: TaskStatus) {
    setMovingId(taskId);

    // Atualiza UI imediatamente (optimistic update)
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      // Reverte se o banco falhou
      console.error('Erro ao atualizar status:', error);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: COLUMN_PREV[newStatus] ?? t.status }
            : t
        )
      );
    }

    setMovingId(null);
  }

  // ── Criar nova tarefa ──────────────────────────────────────────────────────
  async function handleSave(data: NewTask) {
    setSaving(true);

    const { data: inserted, error } = await supabase
      .from('tasks')
      .insert([data])
      .select('*, users(name)')
      .single();

    if (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Não foi possível criar a tarefa. Tente novamente.');
    } else {
      setTasks((prev) => [...prev, inserted as Task]);
      setShowModal(false);
    }

    setSaving(false);
  }
  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    
    const teamTasks  = tasks.filter((t) => t.user_id !== OWNER_ID);
    const total      = teamTasks.length;
    const done       = teamTasks.filter((t) => t.status === 'Concluído').length;
    const inProgress = teamTasks.filter((t) => t.status === 'Em Andamento').length;
    const overdue    = teamTasks.filter((t) => isOverdue(t.due_date, t.status)).length;
    const rate        = total > 0 ? Math.round((done / total) * 100) : 0;

    // Carga: membro com mais tarefas abertas
    const load: Record<string, number> = {};
    tasks
      .filter((t) => t.status !== 'Concluído' && t.users?.name && t.user_id !== OWNER_ID)   
      .forEach((t) => {
        const n = t.users!.name;
        load[n] = (load[n] ?? 0) + 1;
      });
    const topMember = Object.entries(load).sort((a, b) => b[1] - a[1])[0];

    // Quem tem MENOS demandas abertas
    const leastLoaded = Object.entries(load).sort((a, b) => a[1] - b[1])[0];

    // Quem tem MAIS tarefas atrasadas
    const overdueByMember: Record<string, number> = {};
    tasks
      .filter((t) => isOverdue(t.due_date, t.status) && t.users?.name && t.user_id !== OWNER_ID)
      .forEach((t) => {
        const n = t.users!.name;
        overdueByMember[n] = (overdueByMember[n] ?? 0) + 1;
      });
    const mostOverdue = Object.entries(overdueByMember).sort((a, b) => b[1] - a[1])[0];

    // Quem mais concluiu no prazo
    const completedOnTime: Record<string, number> = {};
    tasks
      .filter((t) => t.status === 'Concluído' && t.users?.name && t.user_id !== OWNER_ID)
      .forEach((t) => {
        const n = t.users!.name;
        completedOnTime[n] = (completedOnTime[n] ?? 0) + 1;
      });
    const topCompleter = Object.entries(completedOnTime).sort((a, b) => b[1] - a[1])[0];

    return { total, done, inProgress, overdue, rate, topMember, leastLoaded, mostOverdue, topCompleter };
  }, [tasks]);

  // ── Agrupamento por coluna ─────────────────────────────────────────────────
  const tasksByStatus = useMemo(() =>
    COLUMNS.reduce<Record<TaskStatus, Task[]>>(
      (acc, col) => {
        acc[col] = tasks.filter((t) => t.status === col && t.user_id !== OWNER_ID);
        return acc;
      },
      { 'A Fazer': [], 'Em Andamento': [], 'Concluído': [] }
    ), [tasks]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Dashboard de Atividades
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Visão em tempo real do progresso do time</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden md:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              + Nova tarefa
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-8">
        {/* KPIs */}
        {!loading && !error && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Indicadores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <KpiCard
                label="Taxa de conclusão"
                value={`${kpis.rate}%`}
                sub={`${kpis.done} de ${kpis.total} tarefas`}
                accent={kpis.rate >= 70 ? 'text-emerald-600' : 'text-gray-900'}
              />
              <KpiCard
                label="Em andamento"
                value={kpis.inProgress}
                sub="Tarefas ativas agora"
              />
              <KpiCard
                label="Atrasadas"
                value={kpis.overdue}
                sub="Prazo já expirou"
                accent={kpis.overdue > 0 ? 'text-red-600' : 'text-gray-900'}
              />
              <KpiCard
                label="Total de tarefas"
                value={kpis.total}
                sub="No board atual"
              />
              {kpis.topMember && (
                <KpiCard
                  label="Maior carga"
                  value={kpis.topMember[0].split(' ')[0]}
                  sub={`${kpis.topMember[1]} tarefas abertas`}
                  accent="text-amber-600"
                />
              )}
              {kpis.leastLoaded && (
                <KpiCard
                  label="Menor carga"
                  value={kpis.leastLoaded[0].split(' ')[0]}
                  sub={`${kpis.leastLoaded[1]} tarefas abertas`}
                  accent="text-emerald-600"
                />
              )}
              {kpis.mostOverdue && (
                <KpiCard
                  label="Mais atrasado"
                  value={kpis.mostOverdue[0].split(' ')[0]}
                  sub={`${kpis.mostOverdue[1]} tarefas atrasadas`}
                  accent="text-red-600"
                />
              )}
              {kpis.topCompleter && (
                <KpiCard
                  label="Mais produtivo"
                  value={kpis.topCompleter[0].split(' ')[0]}
                  sub={`${kpis.topCompleter[1]} concluídas`}
                  accent="text-indigo-600"
                />
              )}

            </div>
          </section>
        )}

        {/* Board */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Board
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-4 text-sm">
              {error}
            </div>
          )}

          {loading && <KanbanSkeleton />}

          {!loading && !error && tasks.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <p className="text-lg font-semibold">Nenhuma tarefa cadastrada</p>
              <p className="text-sm mt-1">
                Clique em{' '}
                <button onClick={() => setShowModal(true)} className="text-indigo-500 underline">
                  + Nova tarefa
                </button>{' '}
                para começar.
              </p>
            </div>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="flex gap-5 overflow-x-auto pb-6">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col}
                  status={col}
                  tasks={tasksByStatus[col]}
                  onMove={handleMove}
                  movingId={movingId}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {showModal && createPortal(
        <NewTaskModal
          users={users}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saving={saving}
        />
        , document.body
      )}
    </div>
  );
}