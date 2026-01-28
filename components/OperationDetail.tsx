
import React, { useState, useMemo, useRef } from 'react';
import type { Operation, Event, Task, RatingHistoryEntry, Rating, Sentiment, TaskRule } from '../types';
import { TaskStatus, ratingOptions, WatchlistStatus, Sentiment as SentimentEnum } from '../types';
import { PlusCircleIcon, CheckCircleIcon, EyeIcon, ArrowUpIcon, ArrowRightIcon, ArrowDownIcon, BellIcon, PencilIcon, TrashIcon, DownloadIcon } from './icons/Icons';
import EventForm from './EventForm';
import WatchlistChangeForm from './WatchlistChangeForm';
import ReviewCompletionForm from './ReviewCompletionForm';
import TaskRuleForm from './TaskRuleForm';
import Modal from './Modal';
import AdHocTaskForm from './AdHocTaskForm';
import RatingHistoryChart from './RatingHistoryChart';
import EventHistory from './EventHistory';

interface OperationDetailProps {
  operation: Operation;
  onUpdateOperation: (updatedOperation: Operation) => void;
  onOpenNewTaskModal: (operationId: number) => void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task, updates: { name: string, dueDate: string }) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; highlight?: boolean }> = ({ title, children, highlight = false }) => (
    <div className={`${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'} p-3 rounded-md`}>
        <h4 className={`text-xs ${highlight ? 'text-blue-600' : 'text-gray-500'} font-semibold uppercase`}>{title}</h4>
        <p className={`${highlight ? 'text-blue-900 font-bold text-lg' : 'text-gray-800 font-medium'}`}>{children}</p>
    </div>
);

const getRatingChange = (currentRating: Rating, previousRating: Rating | undefined): 'up' | 'down' | 'neutral' => {
    if (!previousRating || currentRating === previousRating) {
        return 'neutral';
    }
    const currentIndex = ratingOptions.indexOf(currentRating);
    const previousIndex = ratingOptions.indexOf(previousRating);

    if (currentIndex < 0 || previousIndex < 0) return 'neutral';

    if (currentIndex < previousIndex) return 'up'; // Better rating
    if (currentIndex > previousIndex) return 'down'; // Worse rating
    return 'neutral';
};

const RatingChangeIndicator: React.FC<{ change: 'up' | 'down' | 'neutral' }> = ({ change }) => {
    if (change === 'up') {
        return <ArrowUpIcon className="w-4 h-4 text-green-600" title="Upgrade" />;
    }
    if (change === 'down') {
        return <ArrowDownIcon className="w-4 h-4 text-red-600" title="Downgrade" />;
    }
    return <ArrowRightIcon className="w-4 h-4 text-gray-400" title="Sem alteração" />;
};


const OperationDetail: React.FC<OperationDetailProps> = ({ operation, onUpdateOperation, onOpenNewTaskModal, onDeleteTask, onEditTask }) => {
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [isWatchlistFormOpen, setIsWatchlistFormOpen] = useState(false);
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [reviewTaskToComplete, setReviewTaskToComplete] = useState<Task | null>(null);
    
    const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
    const eventRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // State for filtering events
    const [eventDateFilter, setEventDateFilter] = useState({ start: '', end: '' });
    const [eventTypeFilter, setEventTypeFilter] = useState('Todos');
    const [eventPersonFilter, setEventPersonFilter] = useState('Todos');

    // State for filtering tasks
    const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'overdue'>('all');
    const [taskDateFilter, setTaskDateFilter] = useState({ start: '', end: '' });

    // State for managing task rules
    const [ruleToEdit, setRuleToEdit] = useState<TaskRule | null>(null);
    const [ruleToDelete, setRuleToDelete] = useState<TaskRule | null>(null);
    
    // State for managing individual tasks
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);


    const tasks = operation.tasks || [];

    const sortedHistory = useMemo(() => {
        return [...operation.ratingHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [operation.ratingHistory]);

    const currentWatchlistStatus = useMemo(() => {
        return sortedHistory[0]?.watchlist ?? operation.watchlist;
    }, [sortedHistory, operation.watchlist]);
    
    const activeTasks = useMemo(() => {
        return tasks
            .filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.OVERDUE)
            .filter(task => { // Status filter
                if (taskStatusFilter === 'all') return true;
                if (taskStatusFilter === 'pending') return task.status === TaskStatus.PENDING;
                if (taskStatusFilter === 'overdue') return task.status === TaskStatus.OVERDUE;
                return true;
            })
            .filter(task => { // Date filter
                if (!taskDateFilter.start && !taskDateFilter.end) return true;
                const taskDate = new Date(task.dueDate);
                taskDate.setHours(0,0,0,0);
                const startDate = taskDateFilter.start ? new Date(taskDateFilter.start) : null;
                const endDate = taskDateFilter.end ? new Date(taskDateFilter.end) : null;
                if(startDate) startDate.setHours(0,0,0,0);
                if(endDate) endDate.setHours(0,0,0,0);
                if (startDate && taskDate < startDate) return false;
                if (endDate && taskDate > endDate) return false;
                return true;
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [tasks, taskStatusFilter, taskDateFilter]);

    const completedTasks = useMemo(() => {
        return tasks.filter(t => t.status === TaskStatus.COMPLETED)
            .sort((a, b) => {
                const eventA = operation.events.find(e => e.completedTaskId === a.id);
                const eventB = operation.events.find(e => e.completedTaskId === b.id);
                return (eventB ? new Date(eventB.date).getTime() : 0) - (eventA ? new Date(eventA.date).getTime() : 0);
            });
    }, [tasks, operation.events]);
    
    const uniqueEventTypes = useMemo(() => ['Todos', ...new Set(operation.events.map(e => e.type))], [operation.events]);
    const uniqueRegisteredBy = useMemo(() => ['Todos', ...new Set(operation.events.map(e => e.registeredBy))], [operation.events]);

    const filteredEvents = useMemo(() => {
        return [...operation.events]
            .filter(event => {
                if (!eventDateFilter.start && !eventDateFilter.end) return true;
                const eventDate = new Date(event.date);
                eventDate.setHours(0,0,0,0);
                const startDate = eventDateFilter.start ? new Date(eventDateFilter.start) : null;
                const endDate = eventDateFilter.end ? new Date(eventDateFilter.end) : null;
                if(startDate) startDate.setHours(0,0,0,0);
                if(endDate) endDate.setHours(0,0,0,0);
                if (startDate && eventDate < startDate) return false;
                if (endDate && eventDate > endDate) return false;
                return true;
            })
            .filter(event => eventTypeFilter === 'Todos' || event.type === eventTypeFilter)
            .filter(event => eventPersonFilter === 'Todos' || event.registeredBy === eventPersonFilter)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [operation.events, eventDateFilter, eventTypeFilter, eventPersonFilter]);

    const handleSaveEvent = (eventData: Omit<Event, 'id'>, id?: number) => {
        let updatedOperation;
        if (id) {
            const updatedEvents = operation.events.map(e => 
                e.id === id ? { ...e, ...eventData } : e
            );
            updatedOperation = { ...operation, events: updatedEvents };
        } else {
            const eventToSave: Partial<Event> = { ...eventData };
            if (taskToComplete) {
                eventToSave.completedTaskId = taskToComplete.id;
            }
            
            const updatedTasks = taskToComplete
                ? operation.tasks.map(t => t.id === taskToComplete.id ? { ...t, status: TaskStatus.COMPLETED } : t)
                : operation.tasks;

            updatedOperation = {
                ...operation,
                events: [...operation.events, { ...eventToSave, id: Date.now() } as Event],
                tasks: updatedTasks
            };
        }
        onUpdateOperation(updatedOperation);
        setTaskToComplete(null);
        setIsEventFormOpen(false);
        setEventToEdit(null);
    };

    const handleOpenEditEventModal = (event: Event) => {
        setEventToEdit(event);
        setIsEventFormOpen(true);
    };
    
    const handleDownloadEvent = (event: Event) => {
        const content = `
Título: ${event.title}
Data: ${new Date(event.date).toLocaleDateString('pt-BR')}
Tipo: ${event.type}
Registrado por: ${event.registeredBy}

--------------------
Descrição:
--------------------
${event.description}

--------------------
Próximos Passos:
--------------------
${event.nextSteps || 'Nenhum'}
        `.trim().replace(/^\s+/gm, '');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const sanitizedTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `evento_${sanitizedTitle}_${event.id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
    
    const handleSaveReview = (data: { event: Omit<Event, 'id'>, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment }) => {
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
            watchlist: operation.watchlist,
            sentiment: data.sentiment,
            eventId: newEventId,
        };

        const updatedTasks = reviewTaskToComplete
            ? operation.tasks.map(t => t.id === reviewTaskToComplete.id ? { ...t, status: TaskStatus.COMPLETED } : t)
            : operation.tasks;

        const updatedOperation: Operation = {
            ...operation,
            ratingOperation: data.ratingOp,
            ratingGroup: data.ratingGroup,
            events: [...operation.events, eventToSave],
            ratingHistory: [...operation.ratingHistory, newHistoryEntry],
            tasks: updatedTasks
        };
        
        onUpdateOperation(updatedOperation);
        setReviewTaskToComplete(null);
        setIsReviewFormOpen(false);
    };

    const handleSaveWatchlistChange = (data: { watchlist: WatchlistStatus, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment, event: Omit<Event, 'id'>}) => {
        const newEventId = Date.now();
        const eventToSave: Event = { ...data.event, id: newEventId };

        const newHistoryEntry: RatingHistoryEntry = {
            id: Date.now() + 1,
            date: eventToSave.date,
            ratingOperation: data.ratingOp,
            ratingGroup: data.ratingGroup,
            watchlist: data.watchlist,
            sentiment: data.sentiment,
            eventId: newEventId,
        };

        const updatedOperation: Operation = {
            ...operation,
            watchlist: data.watchlist,
            ratingOperation: data.ratingOp,
            ratingGroup: data.ratingGroup,
            events: [...operation.events, eventToSave],
            ratingHistory: [...operation.ratingHistory, newHistoryEntry],
        };

        onUpdateOperation(updatedOperation);
        setIsWatchlistFormOpen(false);
    };

    const handleUpdateRule = (updatedRuleData: Omit<TaskRule, 'id'>) => {
        if (!ruleToEdit) return;
        const updatedRule = { ...ruleToEdit, ...updatedRuleData };
        const updatedOperation = {
            ...operation,
            taskRules: operation.taskRules.map(r => r.id === ruleToEdit.id ? updatedRule : r)
        };
        onUpdateOperation(updatedOperation);
        setRuleToEdit(null);
    };

    const handleConfirmDeleteRule = () => {
        if (!ruleToDelete) return;
        const updatedOperation = {
            ...operation,
            taskRules: operation.taskRules.filter(r => r.id !== ruleToDelete.id)
        };
        onUpdateOperation(updatedOperation);
        setRuleToDelete(null);
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

    const handleViewEventClick = (taskId: string) => {
        const completionEvent = operation.events.find(e => e.completedTaskId === taskId);
        if (completionEvent) {
            setExpandedEventId(completionEvent.id);
            const eventElement = eventRefs.current[completionEvent.id];
            if (eventElement) {
                eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    const watchlistColorClasses = {
      [WatchlistStatus.VERDE]: 'bg-green-500 text-white hover:bg-green-600',
      [WatchlistStatus.AMARELO]: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500',
      [WatchlistStatus.ROSA]: 'bg-pink-500 text-white hover:bg-pink-600',
      [WatchlistStatus.VERMELHO]: 'bg-red-600 text-white hover:bg-red-700',
    };

    return (
        <div className="space-y-8">
            {(isEventFormOpen || eventToEdit) && (
                <EventForm 
                    onClose={() => { setIsEventFormOpen(false); setTaskToComplete(null); setEventToEdit(null); }} 
                    onSave={handleSaveEvent}
                    analystName={operation.responsibleAnalyst}
                    prefilledTitle={taskToComplete ? `Conclusão: ${taskToComplete.ruleName}` : ''}
                    initialData={eventToEdit}
                />
            )}
            {isWatchlistFormOpen && (
                <WatchlistChangeForm
                    operation={operation}
                    onClose={() => setIsWatchlistFormOpen(false)}
                    onSave={handleSaveWatchlistChange}
                />
            )}
            {isReviewFormOpen && reviewTaskToComplete && (
                <ReviewCompletionForm
                    task={reviewTaskToComplete}
                    operation={operation}
                    onClose={() => setIsReviewFormOpen(false)}
                    onSave={handleSaveReview}
                />
            )}
            {ruleToEdit && (
                <Modal isOpen={true} onClose={() => setRuleToEdit(null)} title="Editar Regra de Tarefa">
                    <TaskRuleForm
                        onClose={() => setRuleToEdit(null)}
                        onSave={handleUpdateRule}
                        initialData={ruleToEdit}
                    />
                </Modal>
            )}
            {ruleToDelete && (
                 <Modal
                    isOpen={true}
                    onClose={() => setRuleToDelete(null)}
                    title={`Deletar Regra: ${ruleToDelete.name}`}
                >
                    <div className="text-center">
                        <p className="text-lg text-gray-700 mb-6">
                        Você tem certeza que deseja deletar esta regra de tarefa?
                        </p>
                        <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setRuleToDelete(null)}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmDeleteRule}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Confirmar Deleção
                        </button>
                        </div>
                    </div>
                </Modal>
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
                            Confirmar Deleção
                        </button>
                        </div>
                    </div>
                </Modal>
            )}


            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{operation.name}</h2>
                    <button onClick={() => setIsWatchlistFormOpen(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${watchlistColorClasses[currentWatchlistStatus]}`}>
                        <BellIcon className="w-5 h-5"/> Alterar Watchlist / Rating
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <InfoCard title="Área">{operation.area}</InfoCard>
                    <InfoCard title="Projetos">{operation.projects.map(p => p.name).join(', ')}</InfoCard>
                    <InfoCard title="Garantias">{operation.guarantees.map(g => g.name).join(', ')}</InfoCard>
                    <InfoCard title="Segmento">{operation.segmento}</InfoCard>
                    <InfoCard title="Vencimento" highlight>{operation.maturityDate ? new Date(operation.maturityDate).toLocaleDateString('pt-BR') : 'N/A'}</InfoCard>
                </div>
            </div>

            <EventHistory 
                events={filteredEvents}
                onAddEvent={() => setIsEventFormOpen(true)}
                onEditEvent={handleOpenEditEventModal}
                onDownloadEvent={handleDownloadEvent}
                dateFilter={eventDateFilter}
                onDateFilterChange={setEventDateFilter}
                typeFilter={eventTypeFilter}
                onTypeFilterChange={setEventTypeFilter}
                personFilter={eventPersonFilter}
                onPersonFilterChange={setEventPersonFilter}
                uniqueEventTypes={uniqueEventTypes}
                uniqueRegisteredBy={uniqueRegisteredBy}
                expandedEventId={expandedEventId}
                onToggleExpand={setExpandedEventId}
                eventRefs={eventRefs}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Execução de Tarefas</h3>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="task-status-filter" className="text-sm font-medium text-gray-700">Status:</label>
                             <select id="task-status-filter" value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                                <option value="all">Todas</option>
                                <option value="pending">Pendentes</option>
                                <option value="overdue">Atrasadas</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="task-start-date" className="text-sm font-medium text-gray-700">Venc. De:</label>
                             <input type="date" id="task-start-date" value={taskDateFilter.start} onChange={e => setTaskDateFilter(prev => ({...prev, start: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                        </div>
                         <div>
                            <label htmlFor="task-end-date" className="text-sm font-medium text-gray-700">Venc. Até:</label>
                            <input type="date" id="task-end-date" value={taskDateFilter.end} onChange={e => setTaskDateFilter(prev => ({...prev, end: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                       {activeTasks.map(task => (
                           <div key={task.id} className={`p-3 rounded-md flex justify-between items-center ${task.status === TaskStatus.OVERDUE ? 'bg-red-50 border-l-4 border-red-500' : 'bg-yellow-50 border-l-4 border-yellow-500'}`}>
                               <div>
                                   <p className="font-semibold text-gray-800">{task.ruleName}</p>
                                   <p className={`text-sm ${task.status === TaskStatus.OVERDUE ? 'text-red-700' : 'text-yellow-700'}`}>
                                       Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                   </p>
                               </div>
                               <div className="flex items-center gap-2">
                                    <button onClick={() => setTaskToEdit(task)} className="text-gray-400 hover:text-blue-600" title="Editar Tarefa">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                     <button onClick={() => setTaskToDelete(task)} className="text-gray-400 hover:text-red-600" title="Deletar Tarefa">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleCompleteTaskClick(task)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                                        <CheckCircleIcon className="w-4 h-4" /> Completar
                                    </button>
                               </div>
                           </div>
                       ))}
                        {activeTasks.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma tarefa pendente para os filtros selecionados.</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-700">Regras de Tarefas</h3>
                         <button onClick={() => onOpenNewTaskModal(operation.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                            <PlusCircleIcon className="w-5 h-5"/> Adicionar Tarefa
                        </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {operation.taskRules.map(rule => (
                            <div key={rule.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{rule.name} <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full">{rule.frequency}</span></p>
                                    <p className="text-sm text-gray-600">{rule.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(rule.startDate).toLocaleDateString('pt-BR')} até {new Date(rule.endDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setRuleToEdit(rule)} className="text-gray-400 hover:text-blue-600" title="Editar Regra">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setRuleToDelete(rule)} className="text-gray-400 hover:text-red-600" title="Deletar Regra">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {operation.taskRules.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma regra de tarefa definida.</p>}
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Histórico de Ratings e Sentimentos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sortedHistory.length > 0 ? (
                            sortedHistory.map((entry, index, array) => {
                                const previousEntry = array[index + 1];
                                const opRatingChange = getRatingChange(entry.ratingOperation, previousEntry?.ratingOperation);
                                const groupRatingChange = getRatingChange(entry.ratingGroup, previousEntry?.ratingGroup);

                                return (
                                    <div key={entry.id} className="p-3 bg-gray-50 rounded-md grid grid-cols-4 gap-4 items-center">
                                        <div className="font-medium text-gray-700">{new Date(entry.date).toLocaleDateString('pt-BR')}</div>
                                        <div className="text-sm text-gray-800 flex items-center gap-1.5">
                                            <span className="text-xs text-gray-500">Op: </span>
                                            <RatingChangeIndicator change={opRatingChange} />
                                            {entry.ratingOperation}
                                        </div>
                                        <div className="text-sm text-gray-800 flex items-center gap-1.5">
                                            <span className="text-xs text-gray-500">Grupo: </span>
                                            <RatingChangeIndicator change={groupRatingChange} />
                                            {entry.ratingGroup}
                                        </div>
                                        <div className={`flex items-center gap-2 font-semibold text-sm ${entry.sentiment === 'Positivo' ? 'text-green-600' : entry.sentiment === 'Negativo' ? 'text-red-600' : 'text-gray-600'}`}>
                                            {entry.sentiment === 'Positivo' && <ArrowUpIcon className="w-4 h-4" />}
                                            {entry.sentiment === 'Neutro' && <ArrowRightIcon className="w-4 h-4" />}
                                            {entry.sentiment === 'Negativo' && <ArrowDownIcon className="w-4 h-4" />}
                                            {entry.sentiment}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-gray-500 py-4">Nenhum histórico de rating para esta operação.</p>
                        )}
                    </div>
                    <div>
                        <RatingHistoryChart history={operation.ratingHistory} />
                    </div>
                </div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Histórico de Tarefas Concluídas</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {completedTasks.map(task => {
                        const completionEvent = operation.events.find(e => e.completedTaskId === task.id);
                        return (
                            <div key={task.id} className="p-3 bg-green-50 rounded-md flex justify-between items-center border-l-4 border-green-500">
                                <div>
                                    <p className="font-semibold text-gray-800">{task.ruleName}</p>
                                    <p className="text-sm text-gray-600">
                                        Concluída em: {completionEvent ? new Date(completionEvent.date).toLocaleDateString('pt-BR') : new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                {completionEvent && (
                                    <button onClick={() => handleViewEventClick(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                                        <EyeIcon className="w-4 h-4" /> Ver Evento
                                    </button>
                                )}
                            </div>
                        )
                    })}
                    {completedTasks.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma tarefa foi concluída ainda.</p>}
                </div>
            </div>
        </div>
    );
};

export default OperationDetail;
