
import React, { useState, useEffect, useMemo } from 'react';
import type { Operation, TaskRule } from '../types';
import Modal from './Modal';
import TaskRuleForm from './TaskRuleForm';
import AdHocTaskForm from './AdHocTaskForm';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  operations: Operation[];
  onUpdateOperation: (updatedOperation: Operation) => void;
  preselectedOperationId?: number;
}

const RATING_TO_POLITICA_FREQUENCY: Record<string, string> = {
    'A4': 'Anual', 'Baa1': 'Anual', 'Baa3': 'Anual', 'Baa4': 'Anual',
    'Ba1': 'Anual', 'Ba4': 'Anual', 'Ba5': 'Anual', 'Ba6': 'Anual',
    'B1': 'Semestral', 'B2': 'Semestral', 'B3': 'Semestral',
    'C1': 'Semestral', 'C2': 'Semestral', 'C3': 'Semestral',
};

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, operations, onUpdateOperation, preselectedOperationId }) => {
  const [operationId, setOperationId] = useState<number | null>(null);
  const [formType, setFormType] = useState<'pontual' | 'recorrente'>('pontual');
  const [templateData, setTemplateData] = useState<TaskRule | undefined>(undefined);

  const selectedOperation = useMemo(() => {
    return operations.find(op => op.id === operationId);
  }, [operationId, operations]);

  const handleSaveTaskRule = (rule: Omit<TaskRule, 'id'>) => {
    if (!operationId) return;
    const opToUpdate = operations.find(op => op.id === operationId);
    if (opToUpdate) {
        const updatedOp = {
            ...opToUpdate,
            taskRules: [...opToUpdate.taskRules, { ...rule, id: Date.now() }]
        };
        onUpdateOperation(updatedOp);
    }
    onClose();
  };
  
  useEffect(() => {
      if (isOpen) {
          setOperationId(preselectedOperationId ?? null);
          setFormType('pontual'); // Reset to default tab when opening
          setTemplateData(undefined);
      } else {
          // Delay reset to prevent form disappearing before modal closes
          setTimeout(() => {
              setOperationId(null);
              setTemplateData(undefined);
          }, 200); 
      }
  }, [isOpen, preselectedOperationId]);
  
  const title = selectedOperation 
    ? `Adicionar Tarefa para: ${selectedOperation.name}` 
    : "Adicionar Nova Tarefa";

  const TabButton: React.FC<{isActive: boolean, onClick: () => void, children: React.ReactNode}> = ({ isActive, onClick, children }) => (
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg ${isActive ? 'bg-white border-b-0 border-gray-300 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        style={{border: '1px solid #d1d5db', borderBottom: isActive ? '1px solid white' : '1px solid #d1d5db', marginBottom: '-1px'}}
      >
        {children}
      </button>
  );

  const handleTemplateSelect = (value: string) => {
      if (!selectedOperation) return;
      
      const today = new Date().toISOString().split('T')[0];
      const maturity = selectedOperation.maturityDate ? selectedOperation.maturityDate.split('T')[0] : today;
      
      let newTemplate: Partial<TaskRule> = {
          startDate: today,
          endDate: maturity,
      };

      switch (value) {
          case 'gerencial':
              newTemplate = { ...newTemplate, name: 'Revisão Gerencial', frequency: selectedOperation.reviewFrequency as any, description: 'Revisão periódica gerencial.' };
              break;
          case 'politica':
               const freq = RATING_TO_POLITICA_FREQUENCY[selectedOperation.ratingGroup] || 'Anual';
               newTemplate = { ...newTemplate, name: 'Revisão Política', frequency: freq as any, description: 'Revisão de política de crédito anual.' };
               break;
          case 'call':
              newTemplate = { ...newTemplate, name: 'Call de Acompanhamento', frequency: selectedOperation.callFrequency as any, description: 'Call de acompanhamento.' };
              break;
          case 'dfs':
              newTemplate = { ...newTemplate, name: 'Análise de DFs & Dívida', frequency: selectedOperation.dfFrequency as any, description: 'Análise dos DFs.' };
              break;
          case 'news':
              newTemplate = { ...newTemplate, name: 'Monitorar Notícias', frequency: 'Semanal', description: 'Acompanhar notícias.' };
              break;
          default:
              setTemplateData(undefined);
              return;
      }
      // We cast to TaskRule because the form uses it for initial state, but doesn't strictly require ID for that purpose
      setTemplateData(newTemplate as TaskRule);
  };

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <div className="space-y-4">
        {!preselectedOperationId && (
            <div className="mb-4">
                <label htmlFor="op-select" className="block text-sm font-medium text-gray-700 mb-1">1. Selecione a Operação</label>
                <select
                    id="op-select"
                    value={operationId ?? ''}
                    onChange={e => setOperationId(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Por favor, escolha uma operação --</option>
                    {operations.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                </select>
            </div>
        )}

        {operationId && (
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                    {preselectedOperationId ? 'Defina a Tarefa' : '2. Defina a Tarefa'}
                 </label>
                
                 <div className="flex border-b border-gray-300">
                    <TabButton isActive={formType === 'pontual'} onClick={() => setFormType('pontual')}>
                        Tarefa Pontual
                    </TabButton>
                    <TabButton isActive={formType === 'recorrente'} onClick={() => setFormType('recorrente')}>
                        Tarefa Recorrente (Regra)
                    </TabButton>
                 </div>

                <div className="p-4 border border-t-0 rounded-b-md bg-white">
                     {formType === 'pontual' && (
                        <AdHocTaskForm
                            onClose={onClose}
                            onSave={handleSaveTaskRule}
                        />
                     )}
                     {formType === 'recorrente' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                <label className="block text-xs font-semibold text-blue-700 uppercase mb-1">
                                    Carregar Modelo Padrão (Opcional)
                                </label>
                                <select 
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    value=""
                                >
                                    <option value="" disabled>Selecione para preencher automaticamente...</option>
                                    <option value="gerencial">Revisão Gerencial</option>
                                    <option value="politica">Revisão Política</option>
                                    <option value="call">Call de Acompanhamento</option>
                                    <option value="dfs">Análise de DFs & Dívida</option>
                                    <option value="news">Monitorar Notícias</option>
                                </select>
                            </div>
                            <TaskRuleForm
                                onClose={onClose}
                                onSave={handleSaveTaskRule}
                                initialData={templateData}
                            />
                        </div>
                     )}
                </div>
           </div>
        )}
      </div>
    </Modal>
  );
};

export default NewTaskModal;
