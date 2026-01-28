
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
  const [isSyncing, setIsSyncing] = useState(false);
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
    setIsSyncing(true);
    try {
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
    } finally {
        setIsSyncing(false);
    }
  };

  const handleUpdateOperation = async (updatedOperation: Operation): Promise<void> => {
    const originalOperations = [...operations];
    // Atualização otimista da UI
    setOperations(prev => 
      prev.map(op => op.id === updatedOperation.id ? updatedOperation : op)
    );
    
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/operations/${updatedOperation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOperation),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = 'Falha ao salvar no Databricks.';
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
      showToast('Dados sincronizados com sucesso!', 'success');
    } catch (error) {
      console.error("Error updating operation, rolling back UI:", error);
      setOperations(originalOperations);
      const errorMessage = error instanceof Error ? error.message : 'Erro na sincronização.';
      showToast(`Erro ao sincronizar: ${errorMessage}`, 'error');
      throw error; // Re-throw to handle in the form
    } finally {
        setIsSyncing(false);
    }
  };

  const handleDeleteOperation = async (operationId: number) => {
    const originalOperations = [...operations];
    setOperations(prev => prev.filter(op => op.id !== operationId));
    setIsSyncing(true);
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
      showToast('Erro ao deletar a operação.', 'error');
    } finally {
        setIsSyncing(false);
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
    setIsSyncing(true);
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
    } catch (error) {
        console.error("Error deleting task:", error);
        setOperations(originalOperations);
        showToast('Erro ao deletar a tarefa.', 'error');
    } finally {
        setIsSyncing(false);
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
    setIsSyncing(true);
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
    } catch (error) {
        console.error("Error editing task:", error);
        setOperations(originalOperations);
        showToast('Erro ao editar a tarefa.', 'error');
    } finally {
        setIsSyncing(false);
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

  const handleSaveReview = async (data: { event: Omit<Event, 'id'>, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment }) => {
      const clickedTask = reviewModalState.task;
      if (!clickedTask) return;
      
      const operation = operations.find(op => op.id === clickedTask.operationId);
      if (!operation) return;

      const actualCompletionDate = data.event.date; // Data da conclusão REAL
      const originalTaskDate = new Date(clickedTask.dueDate); // Data original (referência)
      
      // Mês/Ano original para o título (ex: mar/25)
      const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      const formattedOriginalDate = `${monthNames[originalTaskDate.getUTCMonth()]}/${originalTaskDate.getUTCFullYear().toString().slice(-2)}`;

      const baseEventData = {
          date: actualCompletionDate,
          type: 'Revisão Periódica',
          description: data.event.description,
          registeredBy: data.event.registeredBy,
          nextSteps: data.event.nextSteps,
      };

      const reviewTaskNames = ['Revisão Gerencial', 'Revisão Política'];
      const updatedRules = operation.taskRules.map(rule => {
          if (reviewTaskNames.includes(rule.name)) {
              return { ...rule, startDate: actualCompletionDate };
          }
          return rule;
      });

      const eventToAdd: Event = {
          ...baseEventData,
          id: Date.now() + Math.random(),
          // PONTO 1: Título seguindo o padrão solicitado
          title: `Conclusão: Revisão de crédito - ${operation.name} - ${formattedOriginalDate}`,
          completedTaskId: clickedTask.id,
      };

      const newHistoryEntry = {
          id: Date.now() + 1,
          date: actualCompletionDate,
          ratingOperation: data.ratingOp,
          ratingGroup: data.ratingGroup,
          watchlist: operation.watchlist,
          sentiment: data.sentiment,
          eventId: eventToAdd.id,
      };

      const updatedOperation = {
          ...operation,
          ratingOperation: data.ratingOp,
          ratingGroup: data.ratingGroup,
          events: [...operation.events, eventToAdd],
          ratingHistory: [...operation.ratingHistory, newHistoryEntry],
          taskRules: updatedRules,
          tasks: operation.tasks.filter(t => !reviewTaskNames.includes(t.ruleName) || t.status === TaskStatus.COMPLETED)
      };
      
      // PONTO 2: O modal só fecha após o sucesso do handleUpdateOperation (que é await-ado no child)
      try {
        await handleUpdateOperation(updatedOperation);
        setReviewModalState({ isOpen: false, task: null });
      } catch (e) {
        // Erro já tratado pelo toast do handleUpdateOperation
      }
  };

  const renderContent = () => {
    if (error) {
      return <BackendError errorMessage={error} onRetry={fetchOperations} />;
    }
    
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
            <p className="text-xl text-gray-500 animate-pulse">Carregando dados do Databricks...</p>
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
              <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-800">
                    CRM de Crédito Estruturado
                  </h1>
                  {isSyncing && (
                      <span className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse border border-blue-200 shadow-sm">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          Sincronizando Databricks...
                      </span>
                  )}
              </div>
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
