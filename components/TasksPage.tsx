
import React, { useState, useMemo } from 'react';
import type { Operation, Task, Event, Rating, Sentiment, RatingHistoryEntry, Area, TaskRule } from '../types';
import { TaskStatus } from '../types';
import EventForm from './EventForm';
import ReviewCompletionForm from './ReviewCompletionForm';
import { CheckCircleIcon, PlusCircleIcon, PencilIcon, TrashIcon } from './icons/Icons';
import Modal from './Modal';
import AdHocTaskForm from './AdHocTaskForm';

interface TasksPageProps {
  operations: Operation[];
  allTasks: Task[];
  onUpdateOperation: (updatedOperation: Operation) => void;
  onOpenNewTaskModal: (operationId?: number) => void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task, updates: { name: string, dueDate: string }) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ operations, allTasks, onUpdateOperation, onOpenNewTaskModal, onDeleteTask, onEditTask }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAnalyst, setSelectedAnalyst] = useState('Todos');
  const [selectedRuleName, setSelectedRuleName] = useState('Todos');
  const [selectedOperationId, setSelectedOperationId] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState<'All' | Area>('All');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'

  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  
  const [reviewTaskToComplete, setReviewTaskToComplete] = useState<Task | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const analysts = useMemo(() => ['Todos', ...new Set(operations.map(op => op.responsibleAnalyst))], [operations]);
  const ruleNames = useMemo(() => ['Todos', ...new Set(allTasks.map(task => task.ruleName))], [allTasks]);
  const operationsById = useMemo(() => new Map(operations.map(op => [op.id, op])), [operations]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const op = operationsById.get(task.operationId);
      if (!op) return false;
      if (areaFilter !== 'All' && op.area !== areaFilter) return false;
      if (selectedOperationId !== 'Todos' && task.operationId !== parseInt(selectedOperationId, 10)) return false;
      if (selectedAnalyst !== 'Todos' && op.responsibleAnalyst !== selectedAnalyst) return false;
      if (selectedRuleName !== 'Todos' && task.ruleName !== selectedRuleName) return false;
      return true;
    });
  }, [allTasks, operationsById, areaFilter, selectedOperationId, selectedAnalyst, selectedRuleName]);


  const pendingTasksInMonth = useMemo(() => {
    return filteredTasks
      .filter(task => task.status !== TaskStatus.COMPLETED)
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate.getFullYear() === currentMonth.getFullYear() && dueDate.getMonth() === currentMonth.getMonth();
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filteredTasks, currentMonth]);

  const completedTasksInMonth = useMemo(() => {
     return filteredTasks
      .filter(task => task.status === TaskStatus.COMPLETED)
      .filter(task => {
        const op = operationsById.get(task.operationId);
        const completionEvent = op?.events.find(e => e.completedTaskId === task.id);
        if (!completionEvent) return false;
        const completionDate = new Date(completionEvent.date);
        return completionDate.getFullYear() === currentMonth.getFullYear() && completionDate.getMonth() === currentMonth.getMonth();
      })
      .sort((a, b) => {
          const eventA = operationsById.get(a.operationId)?.events.find(e => e.completedTaskId === a.id);
          const eventB = operationsById.get(b.operationId)?.events.find(e => e.completedTaskId === b.id);
          return (eventB ? new Date(eventB.date).getTime() : 0) - (eventA ? new Date(eventA.date).getTime() : 0);
      });
  }, [filteredTasks, currentMonth, operationsById]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };
  
  const handleCompleteTaskClick = (task: Task) => {
    if (task.ruleName === 'Revisão Gerencial' || task.ruleName === 'Revisão Política') {
        setReviewTaskToComplete(task);
        setIsReviewFormOpen(true);
    } else {
        setTaskToComplete(task);
        setIsEventFormOpen(true);
    }
  };
  
  const handleAddEvent = (newEvent: Omit<Event, 'id'>) => {
      if (!taskToComplete) return;

      const operationToUpdate = operationsById.get(taskToComplete.operationId);
      if (operationToUpdate) {
        const eventToSave: Partial<Event> = {
            ...newEvent,
            completedTaskId: taskToComplete.id,
        };
        const updatedTasks = operationToUpdate.tasks.map(t => t.id === taskToComplete.id ? {...t, status: TaskStatus.COMPLETED} : t);

        const updatedOperation = {
            ...operationToUpdate,
            events: [...operationToUpdate.events, { ...eventToSave, id: Date.now() } as Event],
            tasks: updatedTasks,
        };
        onUpdateOperation(updatedOperation);
      }
      
      setTaskToComplete(null);
      setIsEventFormOpen(false);
  };

  const handleSaveReview = (data: { event: Omit<Event, 'id'>, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment }) => {
    if (!reviewTaskToComplete) return;
    const operationToUpdate = operationsById.get(reviewTaskToComplete.operationId);
    if (!operationToUpdate) return;

    const newEventId = Date.now();
    const eventToSave: Event = {
        ...data.event,
        id: newEventId,
        completedTaskId: reviewTaskToComplete?.id
    };

    const newHistoryEntry: RatingHistoryEntry = {
        id: Date.now() + 1,
        date: eventToSave.date,
        ratingOperation: data.ratingOp,
        ratingGroup: data.ratingGroup,
        watchlist: operationToUpdate.watchlist,
        sentiment: data.sentiment,
        eventId: newEventId,
    };

    const updatedTasks = operationToUpdate.tasks.map(t => t.id === reviewTaskToComplete.id ? {...t, status: TaskStatus.COMPLETED} : t);

    const updatedOperation: Operation = {
        ...operationToUpdate,
        ratingOperation: data.ratingOp,
        ratingGroup: data.ratingGroup,
        events: [...operationToUpdate.events, eventToSave],
        ratingHistory: [...operationToUpdate.ratingHistory, newHistoryEntry],
        tasks: updatedTasks
    };
    
    onUpdateOperation(updatedOperation);
    setReviewTaskToComplete(null);
    setIsReviewFormOpen(false);
  };

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) {
        onDeleteTask(taskToDelete);
        setTaskToDelete(null);
    }
  };

  const handleSaveEditedTask = (rule: Omit<TaskRule, 'id'>) => {
      if (taskToEdit) {
          onEditTask(taskToEdit, { name: rule.name, dueDate: rule.startDate });
          setTaskToEdit(null);
      }
  };
  
  return (
    <div className="space-y-6">
       {isEventFormOpen && taskToComplete && (
            <EventForm 
                onClose={() => { setIsEventFormOpen(false); setTaskToComplete(null); }} 
                onSave={handleAddEvent}
                analystName={operationsById.get(taskToComplete.operationId)?.responsibleAnalyst || ''}
                prefilledTitle={`Conclusão: ${taskToComplete.ruleName}`}
            />
        )}
        {isReviewFormOpen && reviewTaskToComplete && (
            <ReviewCompletionForm
                task={reviewTaskToComplete}
                operation={operationsById.get(reviewTaskToComplete.operationId)!}
                onClose={() => { setIsReviewFormOpen(false); setReviewTaskToComplete(null); }}
                onSave={handleSaveReview}
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
                        <button onClick={() => setTaskToDelete(null)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleConfirmDeleteTask} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirmar Deleção</button>
                    </div>
                </div>
            </Modal>
        )}

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Gerenciador de Tarefas</h2>
             <button
                onClick={() => onOpenNewTaskModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                <PlusCircleIcon className="w-5 h-5" /> Adicionar Tarefa
            </button>
        </div>
        
        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
             <div>
              <label htmlFor="area-filter" className="block text-sm font-medium text-gray-700">Área de Negócio</label>
              <select id="area-filter" value={areaFilter} onChange={e => setAreaFilter(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="All">Todas</option>
                <option value="CRI">CRI</option>
                <option value="Capital Solutions">Capital Solutions</option>
              </select>
            </div>
            <div>
              <label htmlFor="analyst-filter" className="block text-sm font-medium text-gray-700">Analista</label>
              <select id="analyst-filter" value={selectedAnalyst} onChange={e => setSelectedAnalyst(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                {analysts.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
                <label htmlFor="operation-filter" className="block text-sm font-medium text-gray-700">Operação</label>
                <select id="operation-filter" value={selectedOperationId} onChange={e => setSelectedOperationId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="Todos">Todas</option>
                    {operations.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="task-type-filter" className="block text-sm font-medium text-gray-700">Tipo de Tarefa</label>
                <select id="task-type-filter" value={selectedRuleName} onChange={e => setSelectedRuleName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    {ruleNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 text-center">Mês</label>
                <div className="flex justify-between items-center mt-1">
                    <button onClick={() => changeMonth(-1)} className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300">&larr;</button>
                    <h3 className="font-semibold text-gray-700">
                        {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300">&rarr;</button>
                </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`${
                        activeTab === 'pending'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                >
                    Tarefas Pendentes ({pendingTasksInMonth.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`${
                        activeTab === 'completed'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                >
                    Tarefas Concluídas ({completedTasksInMonth.length})
                </button>
            </nav>
        </div>
        
        {/* Task List */}
        <div className="space-y-3">
          {activeTab === 'pending' && (
            <>
              {pendingTasksInMonth.map(task => {
                  const operationName = operationsById.get(task.operationId)?.name || 'N/A';
                  return (
                     <div key={task.id} className={`p-4 rounded-md flex justify-between items-center ${task.status === TaskStatus.OVERDUE ? 'bg-red-50 border-l-4 border-red-500' : 'bg-yellow-50 border-l-4 border-yellow-500'}`}>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">{task.ruleName}</p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Operação:</span> {operationName}
                            </p>
                            <p className={`text-sm ${task.status === TaskStatus.OVERDUE ? 'text-red-700' : 'text-yellow-800'}`}>
                                Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setTaskToEdit(task)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full" title="Editar Tarefa">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setTaskToDelete(task)} className="text-gray-400 hover:text-red-600 p-1 rounded-full" title="Deletar Tarefa">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleCompleteTaskClick(task)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                                <CheckCircleIcon className="w-4 h-4" /> Completar
                            </button>
                        </div>
                    </div>
                  );
              })}
              {pendingTasksInMonth.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma tarefa pendente encontrada para os filtros selecionados.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
                {completedTasksInMonth.map(task => {
                    const op = operationsById.get(task.operationId);
                    const operationName = op?.name || 'N/A';
                    const completionEvent = op?.events.find(e => e.completedTaskId === task.id);
                    return (
                        <div key={task.id} className="p-4 rounded-md flex justify-between items-center bg-green-50 border-l-4 border-green-500">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">{task.ruleName}</p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Operação:</span> {operationName}
                                </p>
                                <p className="text-sm text-green-700">
                                    Concluída em: {completionEvent ? new Date(completionEvent.date).toLocaleDateString('pt-BR') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {completedTasksInMonth.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhuma tarefa concluída encontrada para os filtros selecionados.</p>
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;