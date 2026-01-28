
import React, { useState, useEffect } from 'react';
import type { TaskRule, Task } from '../types';
import { Label, Input, Textarea } from './UI';

interface AdHocTaskFormProps {
  onClose: () => void;
  onSave: (rule: Omit<TaskRule, 'id'>) => void;
  initialTask?: Task;
}

const AdHocTaskForm: React.FC<AdHocTaskFormProps> = ({ onClose, onSave, initialTask }) => {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialTask) {
        setName(initialTask.ruleName);
        setDueDate(new Date(initialTask.dueDate).toISOString().split('T')[0]);
        setDescription('');
    }
  }, [initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isoDate = new Date(dueDate + 'T12:00:00').toISOString();
    onSave({
      name,
      frequency: 'Pontual',
      startDate: isoDate,
      endDate: isoDate,
      description,
    });
    onClose();
  };
  
  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="adhoc-name">Nome da Tarefa</Label>
                <Input id="adhoc-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="adhoc-dueDate">Data de Vencimento</Label>
                <Input id="adhoc-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
        </div>
        <div>
            <Label htmlFor="adhoc-description">Descrição</Label>
            <Textarea id="adhoc-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
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
