
import React, { useState, useEffect } from 'react';
import type { TaskRule, Task, TaskPriority } from '../types';
import { Label, Input } from './UI';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface AdHocTaskFormProps {
  onClose: () => void;
  onSave: (rule: Omit<TaskRule, 'id'>) => void;
  initialTask?: Task;
}

const AdHocTaskForm: React.FC<AdHocTaskFormProps> = ({ onClose, onSave, initialTask }) => {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [noDeadline, setNoDeadline] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Média');

  useEffect(() => {
    if (initialTask) {
        setName(initialTask.ruleName);
        if (initialTask.dueDate) {
            setDueDate(new Date(initialTask.dueDate).toISOString().split('T')[0]);
            setNoDeadline(false);
        } else {
            setNoDeadline(true);
        }
        setDescription('');
        setPriority(initialTask.priority || 'Média');
    }
  }, [initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isoDate = noDeadline ? null : new Date(dueDate + 'T12:00:00').toISOString();
    onSave({
      name,
      frequency: noDeadline ? 'Sem Prazo' : 'Pontual',
      startDate: isoDate as any,
      endDate: isoDate as any,
      description,
      priority,
    });
    onClose();
  };
  
  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
                <Label htmlFor="adhoc-name">Nome da Tarefa</Label>
                <Input id="adhoc-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="adhoc-dueDate">Data de Vencimento</Label>
                    <div className="flex items-center gap-1">
                        <input 
                            type="checkbox" 
                            id="no-deadline" 
                            checked={noDeadline} 
                            onChange={e => setNoDeadline(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="no-deadline" className="text-[10px] text-gray-500 font-medium cursor-pointer">Sem Prazo</label>
                    </div>
                </div>
                <Input 
                    id="adhoc-dueDate" 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    required={!noDeadline} 
                    disabled={noDeadline}
                    className={noDeadline ? 'opacity-50' : ''}
                />
            </div>
            <div>
                <Label htmlFor="adhoc-priority">Prioridade</Label>
                <select 
                    id="adhoc-priority"
                    value={priority} 
                    onChange={e => setPriority(e.target.value as TaskPriority)} 
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                </select>
            </div>
        </div>
        <div>
            <Label htmlFor="adhoc-description">Descrição</Label>
            <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
                <ReactQuill 
                    theme="snow" 
                    value={description} 
                    onChange={setDescription} 
                    className="h-32 mb-12"
                />
            </div>
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
