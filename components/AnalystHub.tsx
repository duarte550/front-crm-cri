import React, { useState, useMemo } from 'react';
import type { Operation, Task, Event } from '../types';
import { Page, TaskStatus, TaskPriority } from '../types';
import { CheckCircleIcon, WarningIcon, CalendarIcon, PencilIcon, TrashIcon, PlusCircleIcon, ViewListIcon, ViewBoardsIcon } from './icons/Icons';
import EventForm from './EventForm';
import WatchlistChangeForm from './WatchlistChangeForm';
import AdHocTaskForm from './AdHocTaskForm';
import Modal from './Modal';
import ReviewCompletionForm from './ReviewCompletionForm';
import AnalystCalendar from './AnalystCalendar';
import type { WatchlistStatus, Rating, Sentiment } from '../types';

interface AnalystHubProps {
  operations: Operation[];
  allTasks: Task[];
  onUpdateOperation: (updatedOperation: Operation) => Promise<void>;
  onNavigate: (page: Page, operationId?: number) => void;
  onOpenNewTaskModal: (operationId?: number) => void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task, updates: { name: string, dueDate: string }) => void;
  apiUrl: string;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const AnalystHub: React.FC<AnalystHubProps> = ({
  operations,
  allTasks,
  onUpdateOperation,
  onNavigate,
  onOpenNewTaskModal,
  onDeleteTask,
  onEditTask,
  apiUrl,
  showToast
}) => {
  // Get unique analysts
  const analysts = useMemo(() => {
    const set = new Set<string>();
    operations.forEach(op => {
      if (op.responsibleAnalyst) set.add(op.responsibleAnalyst);
    });
    return Array.from(set).sort();
  }, [operations]);

  const [selectedAnalyst, setSelectedAnalyst] = useState<string>(analysts[0] || '');
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isWatchlistFormOpen, setIsWatchlistFormOpen] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [selectedOperationForAction, setSelectedOperationForAction] = useState<Operation | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [reviewTaskToComplete, setReviewTaskToComplete] = useState<Task | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  const handleOpenEventForm = (operation: Operation) => {
    setSelectedOperationForAction(operation);
    setIsEventFormOpen(true);
  };

  const handleOpenWatchlistForm = (operation: Operation) => {
    setSelectedOperationForAction(operation);
    setIsWatchlistFormOpen(true);
  };

  const handleSaveEvent = async (eventData: Omit<Event, 'id'>) => {
    if (!selectedOperationForAction) return;
    try {
      let updatedTasks = selectedOperationForAction.tasks;
      let eventToSave = { ...eventData, id: Date.now() } as Event;

      if (taskToComplete) {
        eventToSave.completedTaskId = taskToComplete.id;
        updatedTasks = updatedTasks.map(t => 
          t.id === taskToComplete.id ? { ...t, status: TaskStatus.COMPLETED } : t
        );
      }

      const updatedOperation = {
        ...selectedOperationForAction,
        tasks: updatedTasks,
        events: [...selectedOperationForAction.events, eventToSave]
      };
      await onUpdateOperation(updatedOperation);
      showToast('Evento registrado com sucesso!', 'success');
      setIsEventFormOpen(false);
      setSelectedOperationForAction(null);
      setTaskToComplete(null);
    } catch (error) {
      console.error(error);
      showToast('Erro ao registrar evento.', 'error');
    }
  };

  const handleSaveWatchlistChange = async (data: { watchlist: WatchlistStatus, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment, event: Omit<Event, 'id'>}) => {
    if (!selectedOperationForAction) return;
    try {
      const newEventId = Date.now();
      const eventToSave: Event = { ...data.event, id: newEventId };

      const newHistoryEntry = {
        id: Date.now() + 1,
        date: eventToSave.date,
        ratingOperation: data.ratingOp,
        ratingGroup: data.ratingGroup,
        watchlist: data.watchlist,
        sentiment: data.sentiment,
        eventId: newEventId,
      };

      const updatedOperation = {
        ...selectedOperationForAction,
        watchlist: data.watchlist,
        ratingOperation: data.ratingOp,
        ratingGroup: data.ratingGroup,
        events: [...selectedOperationForAction.events, eventToSave],
        ratingHistory: [...selectedOperationForAction.ratingHistory, newHistoryEntry],
      };

      await onUpdateOperation(updatedOperation);
      showToast('Watchlist atualizada com sucesso!', 'success');
      setIsWatchlistFormOpen(false);
      setSelectedOperationForAction(null);
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar watchlist.', 'error');
    }
  };

  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [riskRadarWatchlistFilter, setRiskRadarWatchlistFilter] = useState<string>('Todos');
  const [portfolioWatchlistFilter, setPortfolioWatchlistFilter] = useState<string>('Todos');
  const [sortColumn, setSortColumn] = useState<keyof Operation>('watchlist');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSaveEditedTask = (rule: any) => {
    if (taskToEdit) {
      onEditTask(taskToEdit, { name: rule.name, dueDate: rule.startDate });
      setTaskToEdit(null);
    }
  };

  const handleCompleteTaskClick = (task: Task) => {
    const op = operations.find(o => o.id === task.operationId);
    if (!op) return;
    setSelectedOperationForAction(op);
    if (task.ruleName === 'Revisão Gerencial' || task.ruleName === 'Revisão Política') {
      setReviewTaskToComplete(task);
      setIsReviewFormOpen(true);
    } else {
      setTaskToComplete(task);
      setIsEventFormOpen(true);
    }
  };

  const handleSaveReviewCompletion = async (data: { event: Omit<Event, 'id'>, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment }) => {
    if (!selectedOperationForAction || !reviewTaskToComplete) return;
    try {
      const newEventId = Date.now();
      const eventToSave: Event = { ...data.event, id: newEventId, completedTaskId: reviewTaskToComplete.id };

      const newHistoryEntry = {
        id: Date.now() + 1,
        date: eventToSave.date,
        ratingOperation: data.ratingOp,
        ratingGroup: data.ratingGroup,
        watchlist: selectedOperationForAction.watchlist,
        sentiment: data.sentiment,
        eventId: newEventId,
      };

      const updatedTasks = selectedOperationForAction.tasks.map(t => 
        t.id === reviewTaskToComplete.id ? { ...t, status: TaskStatus.COMPLETED } : t
      );

      const updatedOperation = {
        ...selectedOperationForAction,
        ratingOperation: data.ratingOp,
        ratingGroup: data.ratingGroup,
        tasks: updatedTasks,
        events: [...selectedOperationForAction.events, eventToSave],
        ratingHistory: [...selectedOperationForAction.ratingHistory, newHistoryEntry],
      };

      await onUpdateOperation(updatedOperation);
      showToast('Revisão concluída com sucesso!', 'success');
      setIsReviewFormOpen(false);
      setReviewTaskToComplete(null);
      setSelectedOperationForAction(null);
    } catch (error) {
      console.error(error);
      showToast('Erro ao concluir revisão.', 'error');
    }
  };

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  // Filter operations and tasks for the selected analyst
  const analystOperations = useMemo(() => {
    return operations.filter(op => op.responsibleAnalyst === selectedAnalyst && op.operationType !== 'Geral');
  }, [operations, selectedAnalyst]);

  const filteredAndSortedOperations = useMemo(() => {
    let result = [...analystOperations];
    if (portfolioFilter) {
      const lowerFilter = portfolioFilter.toLowerCase();
      result = result.filter(op => 
        op.name.toLowerCase().includes(lowerFilter) || 
        op.segmento.toLowerCase().includes(lowerFilter) ||
        op.ratingOperation.toLowerCase().includes(lowerFilter)
      );
    }
    
    if (portfolioWatchlistFilter !== 'Todos') {
      result = result.filter(op => op.watchlist === portfolioWatchlistFilter);
    }
    
    return result.sort((a, b) => {
      if (sortColumn === 'watchlist') {
        const order = { 'Vermelho': 1, 'Rosa': 2, 'Amarelo': 3, 'Verde': 4 };
        const aVal = order[a.watchlist as keyof typeof order] || 5;
        const bVal = order[b.watchlist as keyof typeof order] || 5;
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];
      
      if (sortColumn === 'maturityDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [analystOperations, portfolioFilter, portfolioWatchlistFilter, sortColumn, sortDirection]);

  const handleSort = (column: keyof Operation) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const analystTasks = useMemo(() => {
    return allTasks.filter(task => {
      const op = operations.find(o => o.id === task.operationId);
      return op?.responsibleAnalyst === selectedAnalyst;
    });
  }, [allTasks, operations, selectedAnalyst]);

  // Metrics
  const overdueTasks = useMemo(() => analystTasks.filter(t => t.status === 'Atrasada'), [analystTasks]);
  
  const tasksOfTheWeek = useMemo(() => {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    return analystTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate <= endOfWeek && t.status !== 'Concluída';
    });
  }, [analystTasks]);

  const taskProgress = useMemo(() => {
    const total = analystTasks.length;
    const completed = analystTasks.filter(t => t.status === 'Concluída').length;
    const overdue = analystTasks.filter(t => t.status === 'Atrasada').length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, overdue, percent };
  }, [analystTasks]);

  const watchlistAlerts = useMemo(() => {
    let alerts = analystOperations.filter(op => op.watchlist === 'Vermelho' || op.watchlist === 'Rosa');
    if (riskRadarWatchlistFilter !== 'Todos') {
      alerts = alerts.filter(op => op.watchlist === riskRadarWatchlistFilter);
    }
    return alerts.sort((a, b) => {
      const order = { 'Vermelho': 1, 'Rosa': 2, 'Amarelo': 3, 'Verde': 4 };
      const aVal = order[a.watchlist as keyof typeof order] || 5;
      const bVal = order[b.watchlist as keyof typeof order] || 5;
      return aVal - bVal;
    });
  }, [analystOperations, riskRadarWatchlistFilter]);

  // Recent Activity
  const recentEvents = useMemo(() => {
    let events: (Event & { operationName: string, operationId: number })[] = [];
    analystOperations.forEach(op => {
      if (op.events) {
        events = [...events, ...op.events.map(e => ({ ...e, operationName: op.name, operationId: op.id }))];
      }
    });
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [analystOperations]);

  // Task Filters
  const [taskFilter, setTaskFilter] = useState<'Todas' | 'Pendentes' | 'Concluídas' | 'Atrasadas'>('Pendentes');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');

  const filteredTasks = useMemo(() => {
    let filtered = analystTasks;
    if (taskFilter === 'Pendentes') filtered = filtered.filter(t => t.status === 'Pendente');
    if (taskFilter === 'Concluídas') filtered = filtered.filter(t => t.status === 'Concluída');
    if (taskFilter === 'Atrasadas') filtered = filtered.filter(t => t.status === 'Atrasada');
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [analystTasks, taskFilter]);

  const kanbanColumns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cols = {
        overdue: [] as Task[],
        today: [] as Task[],
        next7Days: [] as Task[],
        future: [] as Task[],
        completedRecent: [] as Task[]
    };

    analystTasks.forEach(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (task.status === TaskStatus.COMPLETED) {
            // Find completion event
            const op = operations.find(o => o.id === task.operationId);
            const completionEvent = op?.events?.find(e => e.completedTaskId === task.id);
            if (completionEvent) {
                const completedDate = new Date(completionEvent.date);
                completedDate.setHours(0, 0, 0, 0);
                const diffCompleted = today.getTime() - completedDate.getTime();
                const diffCompletedDays = Math.ceil(diffCompleted / (1000 * 60 * 60 * 24));
                if (diffCompletedDays <= 7) {
                    cols.completedRecent.push(task);
                }
            } else {
                // Fallback to due date if no event found
                if (diffDays >= -7 && diffDays <= 0) {
                    cols.completedRecent.push(task);
                }
            }
        } else if (task.status === TaskStatus.OVERDUE) {
            cols.overdue.push(task);
        } else if (diffDays === 0) {
            cols.today.push(task);
        } else if (diffDays > 0 && diffDays <= 7) {
            cols.next7Days.push(task);
        } else if (diffDays > 7) {
            cols.future.push(task);
        }
    });

    return cols;
  }, [analystTasks, operations]);

  const getPriorityColor = (priority?: TaskPriority) => {
    switch (priority) {
      case 'Urgente': return 'text-purple-600 bg-purple-100';
      case 'Alta': return 'text-red-600 bg-red-100';
      case 'Média': return 'text-yellow-600 bg-yellow-100';
      case 'Baixa': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderTaskCard = (task: Task, isKanban: boolean = false) => {
    const op = operations.find(o => o.id === task.operationId);
    const isCompleted = task.status === TaskStatus.COMPLETED;
    const rulePriority = task.priority || op?.taskRules?.find(r => r.id === task.ruleId)?.priority;
    
    if (isKanban) {
      let statusColor = 'border-gray-200';
      let bgColor = 'bg-white';
      if (task.status === TaskStatus.OVERDUE) {
          statusColor = 'border-red-300';
          bgColor = 'bg-red-50/30';
      } else if (task.status === TaskStatus.COMPLETED) {
          statusColor = 'border-green-300';
          bgColor = 'bg-green-50/30';
      }

      let priorityColor = 'bg-gray-100 text-gray-600';
      if (rulePriority === 'Urgente') priorityColor = 'bg-purple-100 text-purple-700';
      if (rulePriority === 'Alta') priorityColor = 'bg-red-100 text-red-700';
      if (rulePriority === 'Média') priorityColor = 'bg-yellow-100 text-yellow-700';
      if (rulePriority === 'Baixa') priorityColor = 'bg-green-100 text-green-700';

      return (
          <div key={task.id} className={`p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 ${statusColor} ${bgColor} flex flex-col gap-3 transition-all hover:shadow-md`}>
              <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              {op?.name}
                          </span>
                          {rulePriority && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${priorityColor}`}>
                                  {rulePriority}
                              </span>
                          )}
                      </div>
                      <h4 className={`font-semibold text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {task.ruleName}
                      </h4>
                      {task.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.notes}</p>
                      )}
                  </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className={task.status === TaskStatus.OVERDUE ? 'text-red-600' : ''}>
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                  </div>
                  
                  {!isCompleted && (
                      <div className="flex items-center gap-1">
                          <button onClick={() => setTaskToEdit(task)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors" title="Editar Tarefa">
                              <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setTaskToDelete(task)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Deletar Tarefa">
                              <TrashIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleCompleteTaskClick(task)} className="ml-1 flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium shadow-sm transition-colors">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Concluir
                          </button>
                      </div>
                  )}
              </div>
          </div>
      );
    }

    return (
      <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between group">
        <div className="flex items-start gap-3">
          <button 
            onClick={() => handleCompleteTask(task)}
            className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${task.status === 'Concluída' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500'}`}
          >
            {task.status === 'Concluída' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
          </button>
          <div>
            <p className={`font-medium ${task.status === 'Concluída' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.ruleName}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => onNavigate(Page.DETAIL, op?.id)}>{op?.name}</span>
              <span>•</span>
              <span className={task.status === 'Atrasada' ? 'text-red-600 font-medium' : ''}>Vence: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
              {rulePriority && (
                <>
                  <span>•</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityColor(rulePriority)}`}>{rulePriority}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isCompleted && (
            <button onClick={() => handleCompleteTaskClick(task)} className="p-1 text-gray-400 hover:text-green-600" title="Concluir">
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setTaskToEdit(task)} className="p-1 text-gray-400 hover:text-blue-600" title="Editar">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => setTaskToDelete(task)} className="p-1 text-gray-400 hover:text-red-600" title="Excluir">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const getWatchlistColor = (status: string) => {
    switch (status) {
      case 'Verde': return 'bg-green-100 text-green-800 border-green-200';
      case 'Amarelo': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Vermelho': return 'bg-red-100 text-red-800 border-red-200';
      case 'Rosa': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (task.status === 'Concluída') return;
    try {
      const response = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId: task.operationId,
          date: new Date().toISOString(),
          type: 'Tarefa Concluída',
          title: `Tarefa Concluída: ${task.ruleName}`,
          description: `A tarefa "${task.ruleName}" foi marcada como concluída.`,
          registeredBy: selectedAnalyst,
          completedTaskId: task.id
        })
      });
      if (!response.ok) throw new Error('Falha ao concluir tarefa');
      const updatedOp = await response.json();
      await onUpdateOperation(updatedOp);
      showToast('Tarefa concluída com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao concluir tarefa.', 'error');
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hub do Analista</h1>
          <p className="text-gray-500 mt-1">Visão consolidada e foco do dia</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Analista:</label>
          <select
            value={selectedAnalyst}
            onChange={(e) => setSelectedAnalyst(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
          >
            {analysts.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <WarningIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tarefas Atrasadas</p>
            <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tarefas da Semana</p>
            <p className="text-2xl font-bold text-gray-900">{tasksOfTheWeek.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <WarningIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Alertas Watchlist</p>
            <p className="text-2xl font-bold text-gray-900">{watchlistAlerts.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Operações</p>
            <p className="text-2xl font-bold text-gray-900">{analystOperations.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tasks & Watchlist */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* My Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                Foco do Dia (Minhas Tarefas)
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => onOpenNewTaskModal()} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-1">
                  <PlusCircleIcon className="w-4 h-4" /> Nova Tarefa
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm font-bold text-gray-700">Progresso Geral</span>
                  <span className="text-xs text-gray-500 ml-2">({taskProgress.completed} de {taskProgress.total} concluídas)</span>
                </div>
                <span className="text-lg font-black text-blue-600">{taskProgress.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${taskProgress.percent}%` }}
                ></div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{taskProgress.overdue} Atrasadas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{taskProgress.total - taskProgress.completed - taskProgress.overdue} Pendentes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{taskProgress.completed} Concluídas</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex gap-2">
                {['Todas', 'Pendentes', 'Concluídas', 'Atrasadas'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter as any)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${taskFilter === filter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setTaskViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${taskViewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Visualização em Lista"
                >
                  <ViewListIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTaskViewMode('kanban')}
                  className={`p-1.5 rounded-md transition-colors ${taskViewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Visualização em Quadro"
                >
                  <ViewBoardsIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTaskViewMode('calendar')}
                  className={`p-1.5 rounded-md transition-colors ${taskViewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Visualização em Calendário"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {taskViewMode === 'list' && (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl">
                  {filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhuma tarefa encontrada.</div>
                  ) : (
                    filteredTasks.map(task => renderTaskCard(task, false))
                  )}
                </div>
              )}

              {taskViewMode === 'kanban' && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
                  <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[600px]">
                      <div className="p-3 border-b border-gray-200 bg-red-50/50 rounded-t-xl">
                          <h3 className="font-bold text-red-800 text-sm flex justify-between items-center">
                              Atrasadas <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-xs">{kanbanColumns.overdue.length}</span>
                          </h3>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                          {kanbanColumns.overdue.map(t => renderTaskCard(t, true))}
                      </div>
                  </div>

                  <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[600px]">
                      <div className="p-3 border-b border-gray-200 bg-blue-50/50 rounded-t-xl">
                          <h3 className="font-bold text-blue-800 text-sm flex justify-between items-center">
                              Para Hoje <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">{kanbanColumns.today.length}</span>
                          </h3>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                          {kanbanColumns.today.map(t => renderTaskCard(t, true))}
                      </div>
                  </div>

                  <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[600px]">
                      <div className="p-3 border-b border-gray-200 bg-yellow-50/50 rounded-t-xl">
                          <h3 className="font-bold text-yellow-800 text-sm flex justify-between items-center">
                              Próximos 7 Dias <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs">{kanbanColumns.next7Days.length}</span>
                          </h3>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                          {kanbanColumns.next7Days.map(t => renderTaskCard(t, true))}
                      </div>
                  </div>

                  <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[600px]">
                      <div className="p-3 border-b border-gray-200 bg-purple-50/50 rounded-t-xl">
                          <h3 className="font-bold text-purple-800 text-sm flex justify-between items-center">
                              Futuras <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">{kanbanColumns.future.length}</span>
                          </h3>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                          {kanbanColumns.future.map(t => renderTaskCard(t, true))}
                      </div>
                  </div>

                  <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[600px]">
                      <div className="p-3 border-b border-gray-200 bg-green-50/50 rounded-t-xl">
                          <h3 className="font-bold text-green-800 text-sm flex justify-between items-center">
                              Concluídas (7 dias) <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">{kanbanColumns.completedRecent.length}</span>
                          </h3>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                          {kanbanColumns.completedRecent.map(t => renderTaskCard(t, true))}
                      </div>
                  </div>
                </div>
              )}

              {taskViewMode === 'calendar' && (
                <div className="h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AnalystCalendar 
                    tasks={analystTasks} 
                    operations={operations} 
                    onCompleteTask={handleCompleteTaskClick}
                    onOpenNewTaskModal={onOpenNewTaskModal}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Risk Radar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <WarningIcon className="w-5 h-5 text-red-500" />
                Radar de Risco
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={riskRadarWatchlistFilter}
                  onChange={(e) => setRiskRadarWatchlistFilter(e.target.value)}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Todos">Todos os Alertas</option>
                  <option value="Vermelho">Vermelho</option>
                  <option value="Rosa">Rosa</option>
                </select>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlistAlerts.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-4">Nenhuma operação em alerta.</div>
              ) : (
                watchlistAlerts.map(op => (
                  <div key={op.id} className={`border rounded-lg p-4 ${getWatchlistColor(op.watchlist)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold cursor-pointer hover:underline" onClick={() => onNavigate(Page.DETAIL, op.id)}>{op.name}</h3>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50">{op.ratingOperation}</span>
                    </div>
                    <p className="text-sm mb-4 opacity-80">Último evento: {op.events?.[0]?.title || 'Nenhum'}</p>
                    <div className="flex gap-2">
                      <button onClick={() => onNavigate(Page.DETAIL, op.id)} className="text-xs bg-white/50 hover:bg-white/80 px-2 py-1 rounded font-medium transition-colors">Ver Detalhes</button>
                      <button onClick={() => handleOpenEventForm(op)} className="text-xs bg-white/50 hover:bg-white/80 px-2 py-1 rounded font-medium transition-colors">Registrar Evento</button>
                      <button onClick={() => handleOpenWatchlistForm(op)} className="text-xs bg-white/50 hover:bg-white/80 px-2 py-1 rounded font-medium transition-colors">Alterar Status</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                Atividade Recente
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {recentEvents.length === 0 ? (
                  <div className="text-center text-gray-500">Nenhuma atividade recente.</div>
                ) : (
                  recentEvents.map((event, idx) => (
                    <div key={event.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 text-sm">{event.title}</span>
                          <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium mb-2 cursor-pointer hover:underline" onClick={() => onNavigate(Page.DETAIL, event.operationId)}>{event.operationName}</p>
                        <div className="relative">
                          <p className={`text-sm text-gray-600 ${expandedEventId === event.id ? '' : 'line-clamp-2'}`}>
                            {event.description}
                          </p>
                          {event.description && event.description.length > 100 && (
                            <button 
                              onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                            >
                              {expandedEventId === event.id ? 'Ver menos' : 'Ver mais'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Portfolio Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Meu Portfólio
          </h2>
          <div className="flex items-center gap-4">
            <select
              value={portfolioWatchlistFilter}
              onChange={(e) => setPortfolioWatchlistFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Todos">Todos os Faróis</option>
              <option value="Verde">Verde</option>
              <option value="Amarelo">Amarelo</option>
              <option value="Rosa">Rosa</option>
              <option value="Vermelho">Vermelho</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar operações..."
                value={portfolioFilter}
                onChange={(e) => setPortfolioFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Operação {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('segmento')}>
                  Setor {sortColumn === 'segmento' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ratingOperation')}>
                  Rating {sortColumn === 'ratingOperation' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('maturityDate')}>
                  Vencimento {sortColumn === 'maturityDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedOperations.map(op => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${op.watchlist === 'Verde' ? 'bg-green-500' : op.watchlist === 'Amarelo' ? 'bg-yellow-500' : op.watchlist === 'Vermelho' ? 'bg-red-500' : 'bg-pink-500'}`}></div>
                      <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => onNavigate(Page.DETAIL, op.id)}>{op.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.segmento}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {op.ratingOperation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(op.maturityDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onOpenNewTaskModal(op.id)} className="text-blue-600 hover:text-blue-900 mr-3" title="Nova Tarefa">
                      <PlusCircleIcon className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleOpenEventForm(op)} className="text-green-600 hover:text-green-900 mr-3" title="Novo Evento">
                      <CalendarIcon className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleOpenWatchlistForm(op)} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Alterar Watchlist/Rating">
                      <WarningIcon className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => onNavigate(Page.DETAIL, op.id)} className="text-gray-600 hover:text-gray-900" title="Ver Detalhes">
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isEventFormOpen && selectedOperationForAction && (
        <EventForm
          onClose={() => {
            setIsEventFormOpen(false);
            setSelectedOperationForAction(null);
            setTaskToComplete(null);
          }}
          onSave={handleSaveEvent}
          analystName={selectedAnalyst}
          prefilledTitle={taskToComplete ? `Conclusão: ${taskToComplete.ruleName}` : undefined}
        />
      )}
      {isReviewFormOpen && selectedOperationForAction && reviewTaskToComplete && (
        <ReviewCompletionForm
          task={reviewTaskToComplete}
          operation={selectedOperationForAction}
          onClose={() => {
            setIsReviewFormOpen(false);
            setReviewTaskToComplete(null);
            setSelectedOperationForAction(null);
          }}
          onSave={handleSaveReviewCompletion}
        />
      )}
      {isWatchlistFormOpen && selectedOperationForAction && (
        <WatchlistChangeForm
          operation={selectedOperationForAction}
          onClose={() => {
            setIsWatchlistFormOpen(false);
            setSelectedOperationForAction(null);
          }}
          onSave={handleSaveWatchlistChange}
        />
      )}
      {taskToEdit && (
        <Modal isOpen={true} onClose={() => setTaskToEdit(null)} title="Editar Tarefa">
          <AdHocTaskForm
            onClose={() => setTaskToEdit(null)}
            onSave={handleSaveEditedTask}
            initialTask={taskToEdit}
          />
        </Modal>
      )}
      {taskToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setTaskToDelete(null)}
          title={`Deletar Tarefa: ${taskToDelete.ruleName}`}
        >
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-6">
              Você tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteTask}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnalystHub;
