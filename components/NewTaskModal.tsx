
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

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, operations, onUpdateOperation, preselectedOperationId }) => {
  const [operationId, setOperationId] = useState<number | null>(null);
  const [formType, setFormType] = useState<'pontual' | 'recorrente'>('pontual');

  const preselectedOperation = useMemo(() => {
    if (!preselectedOperationId) return null;
    return operations.find(op => op.id === preselectedOperationId);
  }, [preselectedOperationId, operations]);

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
      } else {
          // Delay reset to prevent form disappearing before modal closes
          setTimeout(() => setOperationId(null), 200); 
      }
  }, [isOpen, preselectedOperationId]);
  
  const title = preselectedOperation 
    ? `Adicionar Tarefa para: ${preselectedOperation.name}` 
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
                        <TaskRuleForm
                            onClose={onClose}
                            onSave={handleSaveTaskRule}
                        />
                     )}
                </div>
           </div>
        )}
      </div>
    </Modal>
  );
};

export default NewTaskModal;