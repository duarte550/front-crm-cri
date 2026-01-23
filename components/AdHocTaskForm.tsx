
import React, { useState, useEffect } from 'react';
import type { TaskRule, Task } from '../types';

interface AdHocTaskFormProps {
  onClose: () => void;
  onSave: (rule: Omit<TaskRule, 'id'>) => void;
  initialTask?: Task;
}

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({ htmlFor, children }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;

const AdHocTaskForm: React.FC<AdHocTaskFormProps> = ({ onClose, onSave, initialTask }) => {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialTask) {
        setName(initialTask.ruleName);
        setDueDate(new Date(initialTask.dueDate).toISOString().split('T')[0]);
        // A description might not exist for a generated task, so we default to an empty string.
        setDescription('');
    }
  }, [initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      frequency: 'Pontual',
      startDate: new Date(dueDate).toISOString(),
      endDate: new Date(dueDate).toISOString(), // For pontual, start and end are the same
      description,
    });
    onClose();
  };
  
  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="adhoc-name">Nome da Tarefa</Label>
                <input id="adhoc-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
                <Label htmlFor="adhoc-dueDate">Data de Vencimento</Label>
                <input id="adhoc-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
        </div>
        <div>
            <Label htmlFor="adhoc-description">Descrição</Label>
            <textarea id="adhoc-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
         <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {initialTask ? 'Salvar Alterações' : 'Salvar Tarefa'}
          </button>
        </div>
      </form>
  );
};

export default AdHocTaskForm;
