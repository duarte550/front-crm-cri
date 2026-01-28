
import React, { useState, useMemo, useEffect, useCallback } from 'react';
// FIX: Import Event to resolve name collision with DOM Event type, and TaskStatus for enum usage.
import type { Operation, Task, TaskRule, Rating, Sentiment, Event } from './types';
import { Page, TaskStatus } from './types';
import OverviewDashboard from './components/OverviewDashboard';
import OperationDetail from './components/OperationDetail';
import TasksPage from './components/TasksPage';
import Sidebar from './components/Sidebar';
import OverdueOperationsHighlight from './components/OverdueOperationsHighlight';
import NewTaskModal from './components/NewTaskModal';
import BackendError from './components/BackendError';
import AuditLogPage from './components/AuditLogPage';
import WatchlistPage from './components/WatchlistPage';
import CreditReviewsPage from './components/CreditReviewsPage';
import ReviewCompletionForm from './components/ReviewCompletionForm';
import Toast from './components/Toast';

const API_BASE_URL = 'https://crmcri-flask.onrender.com';

const App: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>(Page.OVERVIEW);
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);
  const [newTaskModalState, setNewTaskModalState] = useState<{isOpen: boolean; operationId?: number}>({ isOpen: false });
  const [reviewModalState, setReviewModalState] = useState<{isOpen: boolean; task: Task | null}>({isOpen: false, task: null});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
  };

  const fetchOperations = useCallback(async () => {
    setIsLoading(true);
    setError(null); 
    try {
      const response = await fetch(`${API_BASE_URL}/api/operations`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`O servidor respondeu com o status: ${response.status}`);
      }
      const data: Operation[] = await response.json();
      setOperations(data);
    } catch (error) {
      console.error("Error fetching operations:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocorreu um erro de rede desconhecido.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const allTasks = useMemo(() => {
    return operations.flatMap(op => op.tasks || []);
  }, [operations]);

  const handleNavigate = (page: Page, operationId?: number) => {
    setCurrentPage(page);
    setSelectedOperationId(operationId ?? null);
  };
  
  const handleAddOperation = async (newOperationData: any) => {
    try {
        // Fix date shift by ensuring the date string is interpreted in local time or mid-day
        if (newOperationData.maturityDate) {
            newOperationData.maturityDate = new Date(newOperationData.maturityDate + 'T12:00:00').toISOString();
        }

        const response = await fetch(`${API_BASE_URL}/api/operations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOperationData),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao salvar a operação');
        const savedOperation = await response.json();
        setOperations(prev => [ ...prev, savedOperation ]);
        showToast('Operação adicionada com sucesso!', 'success');
        handleNavigate(Page.DETAIL, savedOperation.id);
    } catch (error) {
        console.error("Error adding operation:", error);
        showToast('Erro ao adicionar operação.', 'error');
    }
  };

  const handleUpdateOperation = async (updatedOperation: Operation) => {
    const originalOperations = [...operations];
    setOperations(prev => 
      prev.map(op => op.id === updatedOperation.id ? updatedOperation : op)
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/operations/${updatedOperation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOperation),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = 'Falha ao salvar as alterações. Tente novamente.';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch(e) { }
        throw new Error(errorMsg);
      }
      
      const returnedOperation = await response.json();
      setOperations(prev => 
        prev.map(op => op.id === returnedOperation.id ? returnedOperation : op)
      );
      showToast('Alterações salvas com sucesso!', 'success');
    } catch (error) {
      console.error("Error updating operation, rolling back UI:", error);
      setOperations(originalOperations);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      showToast(`Erro ao salvar: ${errorMessage}`, 'error');
    }
  };

  const handleDeleteOperation = async (operationId: number) => {
    const originalOperations = [...operations];
    setOperations(prev => prev.filter(op => op.id !== operationId));

    try {
      const response = await fetch(`${API_BASE_URL}/api/operations/${operationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Falha ao deletar a operação');
      }
      
      if (selectedOperationId === operationId) {
        handleNavigate(Page.OVERVIEW);
      }
      showToast('Operação deletada com sucesso!', 'success');
    } catch (error) {
      console.error("Error deleting operation:", error);
      setOperations(originalOperations);
      showToast('Erro ao deletar a operação. A exclusão foi revertida.', 'error');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const originalOperations = [...operations];
    setOperations(prevOps => prevOps.map(op => {
        if (op.id === task.operationId) {
            return {
                ...op,
                tasks: op.tasks.filter(t => t.id !== task.id)
            };
        }
        return op;
    }));

    try {
        const response = await fetch(`${API_BASE_URL}/api/tasks/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: task.id, operationId: task.operationId, responsibleAnalyst: operations.find(o=>o.id === task.operationId)?.responsibleAnalyst }),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao deletar a tarefa');
        
        const updatedOperation = await response.json();
        setOperations(prev => prev.map(op => op.id === updatedOperation.id ? updatedOperation : op));
        showToast('Tarefa deletada com sucesso!', 'success');

    } catch (error) {
        console.error("Error deleting task:", error);
        setOperations(originalOperations);
        showToast('Erro ao deletar a tarefa.', 'error');
    }
  };

  const handleEditTask = async (task: Task, updates: { name: string, dueDate: string }) => {
    const originalOperations = [...operations];
    setOperations(prevOps => prevOps.map(op => {
        if (op.id === task.operationId) {
            const filteredTasks = op.tasks.filter(t => t.id !== task.id);
            const newAdHocRule: TaskRule = {
                id: Date.now(),
                name: updates.name,
                frequency: 'Pontual',
                startDate: new Date(updates.dueDate + 'T12:00:00').toISOString(),
                endDate: new Date(updates.dueDate + 'T12:00:00').toISOString(),
                description: `Tarefa editada a partir da tarefa original: ${task.ruleName} (ID: ${task.id})`,
            };
            return {
                ...op,
                tasks: filteredTasks,
                taskRules: [...op.taskRules, newAdHocRule]
            };
        }
        return op;
    }));

    try {
         const response = await fetch(`${API_BASE_URL}/api/tasks/edit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalTaskId: task.id,
                operationId: task.operationId,
                updates: updates,
                responsibleAnalyst: operations.find(o => o.id === task.operationId)?.responsibleAnalyst
            }),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao editar a tarefa');

        const updatedOperation = await response.json();
        setOperations(prev => prev.map(op => op.id === updatedOperation.id ? updatedOperation : op));
        showToast('Tarefa editada com sucesso!', 'success');

    } catch (error) {
        console.error("Error editing task:", error);
        setOperations(originalOperations);
        showToast('Erro ao editar a tarefa.', 'error');
    }
  };
  
  const selectedOperation = useMemo(() => {
    return operations.find(op => op.id === selectedOperationId) || null;
  }, [operations, selectedOperationId]);

  const openNewTaskModal = (operationId?: number) => {
    setNewTaskModalState({ isOpen: true, operationId });
  };
  const closeNewTaskModal = () => {
    setNewTaskModalState({ isOpen: false });
  };

  const handleSaveReview = (data: { event: Omit<Event, 'id'>, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment }) => {
      const clickedTask = reviewModalState.task;
      if (!clickedTask) return;
      
      const operation = operations.find(op => op.id === clickedTask.operationId);
      if (!operation) return;

      const eventsToAdd: Event[] = [];
      const gerencialTaskToComplete = operation.nextReviewGerencialTask;
      const politicaTaskToComplete = operation.nextReviewPoliticaTask;

      // Fix date shift in event completion
      const baseEventData = {
          date: new Date(data.event.date + 'T12:00:00').toISOString(),
          type: 'Revisão Periódica',
          description: data.event.description,
          registeredBy: data.event.registeredBy,
          nextSteps: data.event.nextSteps,
      };

      if (gerencialTaskToComplete) {
          eventsToAdd.push({
              ...baseEventData,
              id: Date.now() + Math.random(),
              title: `Conclusão: Revisão Gerencial`,
              completedTaskId: gerencialTaskToComplete.id,
          });
      }

      if (politicaTaskToComplete && politicaTaskToComplete.id !== gerencialTaskToComplete?.id) {
          eventsToAdd.push({
              ...baseEventData,
              id: Date.now() + Math.random(),
              title: `Conclusão: Revisão Política`,
              completedTaskId: politicaTaskToComplete.id,
          });
      }

      if (eventsToAdd.length === 0) {
          eventsToAdd.push({
              ...baseEventData,
              id: Date.now() + Math.random(),
              title: `Revisão Periódica (Manual)`,
              completedTaskId: clickedTask.id,
          });
      }

      const newHistoryEntry = {
          id: Date.now() + 1,
          date: baseEventData.date,
          ratingOperation: data.ratingOp,
          ratingGroup: data.ratingGroup,
          watchlist: operation.watchlist,
          sentiment: data.sentiment,
          eventId: eventsToAdd[0].id,
      };

      const tasksToCompleteIds = new Set([gerencialTaskToComplete?.id, politicaTaskToComplete?.id].filter(Boolean));
      const updatedTasks = operation.tasks.map(t => {
          if (tasksToCompleteIds.has(t.id)) {
              return { ...t, status: TaskStatus.COMPLETED };
          }
          return t;
      });

      const pendingAndOverdueTasks = updatedTasks.filter(t => t.status !== TaskStatus.COMPLETED);
      const nextGerencialTasks = pendingAndOverdueTasks
          .filter(t => t.ruleName === 'Revisão Gerencial')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      const nextPoliticaTasks = pendingAndOverdueTasks
          .filter(t => t.ruleName === 'Revisão Política')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      const nextReviewGerencialTask = nextGerencialTasks[0] || null;
      const nextReviewPoliticaTask = nextPoliticaTasks[0] || null;

      const updatedOperation = {
          ...operation,
          ratingOperation: data.ratingOp,
          ratingGroup: data.ratingGroup,
          events: [...operation.events, ...eventsToAdd],
          ratingHistory: [...operation.ratingHistory, newHistoryEntry],
          tasks: updatedTasks,
          nextReviewGerencialTask,
          nextReviewPoliticaTask,
          nextReviewGerencial: nextReviewGerencialTask?.dueDate || null,
          nextReviewPolitica: nextReviewPoliticaTask?.dueDate || null,
      };
      
      handleUpdateOperation(updatedOperation);
      setReviewModalState({ isOpen: false, task: null });
  };

  const renderContent = () => {
    if (error) {
      return <BackendError errorMessage={error} onRetry={fetchOperations} />;
    }
    
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
            <p className="text-xl text-gray-500 animate-pulse">Carregando dados...</p>
        </div>
      );
    }

    switch (currentPage) {
        case Page.OVERVIEW:
            return (
                <>
                    <OverdueOperationsHighlight
                        operations={operations}
                        onNavigate={handleNavigate}
                    />
                    <OverviewDashboard
                        operations={operations}
                        onSelectOperation={(id) => handleNavigate(Page.DETAIL, id)}
                        onAddOperation={handleAddOperation}
                        onOpenNewTaskModal={openNewTaskModal}
                        onDeleteOperation={handleDeleteOperation}
                    />
                </>
            );
        case Page.DETAIL:
            return selectedOperation ? (
              <OperationDetail 
                operation={selectedOperation}
                onUpdateOperation={handleUpdateOperation}
                onOpenNewTaskModal={openNewTaskModal}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
              />
            ) : (
               <div>
                <h2 className="text-xl font-semibold mb-4">Operação não encontrada</h2>
                <p>Por favor, selecione uma operação válida na barra lateral.</p>
              </div>
            );
        case Page.TASKS:
            return <TasksPage
                operations={operations}
                allTasks={allTasks}
                onUpdateOperation={handleUpdateOperation}
                onOpenNewTaskModal={openNewTaskModal}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
            />;
        case Page.CREDIT_REVIEWS:
            return <CreditReviewsPage
                operations={operations}
                onUpdateOperation={handleUpdateOperation}
                onCompleteReview={(task) => setReviewModalState({ isOpen: true, task })}
                apiUrl={API_BASE_URL}
                showToast={showToast}
            />;
        case Page.AUDIT_LOG:
            return <AuditLogPage apiUrl={API_BASE_URL} />;
        case Page.WATCHLIST:
            return <WatchlistPage 
                operations={operations}
                onUpdateOperation={handleUpdateOperation}
            />;
        default:
             return <OverviewDashboard
                operations={operations}
                onSelectOperation={(id) => handleNavigate(Page.DETAIL, id)}
                onAddOperation={handleAddOperation}
                onOpenNewTaskModal={openNewTaskModal}
                onDeleteOperation={handleDeleteOperation}
            />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <NewTaskModal
        isOpen={newTaskModalState.isOpen}
        onClose={closeNewTaskModal}
        operations={operations}
        onUpdateOperation={handleUpdateOperation}
        preselectedOperationId={newTaskModalState.operationId}
      />
      {reviewModalState.isOpen && reviewModalState.task && (
          <ReviewCompletionForm
              task={reviewModalState.task}
              operation={operations.find(op => op.id === reviewModalState.task!.operationId)!}
              onClose={() => setReviewModalState({ isOpen: false, task: null })}
              onSave={handleSaveReview}
          />
      )}
      <Sidebar
        operations={operations}
        currentPage={currentPage}
        selectedOperationId={selectedOperationId}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-gray-800">
                CRM de Crédito Estruturado
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
