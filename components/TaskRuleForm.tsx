
import React, { useState, useEffect } from 'react';
import type { TaskRule } from '../types';
import { Label, Input, Select, Textarea } from './UI';

interface TaskRuleFormProps {
  onClose: () => void;
  onSave: (rule: Omit<TaskRule, 'id'>) => void;
  initialData?: TaskRule;
}

const TaskRuleForm: React.FC<TaskRuleFormProps> = ({ onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<TaskRule['frequency']>('Mensal');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
        setName(initialData.name);
        setFrequency(initialData.frequency);
        setStartDate(new Date(initialData.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(initialData.endDate).toISOString().split('T')[0]);
        setDescription(initialData.description);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      frequency,
      startDate: new Date(startDate + 'T12:00:00').toISOString(),
      endDate: endDate ? new Date(endDate + 'T12:00:00').toISOString() : new Date(startDate + 'T12:00:00').toISOString(),
      description,
    });
    onClose();
  };
  
  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <Label htmlFor="name">Nome da Regra</Label>
            <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select id="frequency" value={frequency} onChange={e => setFrequency(e.target.value as TaskRule['frequency'])}>
                    <option>Diário</option>
                    <option>Semanal</option>
                    <option>Quinzenal</option>
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                </Select>
            </div>
            <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="endDate">Data de Fim</Label>
                <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
        </div>
        <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        </div>
         <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {initialData ? 'Salvar Alterações' : 'Salvar Regra'}
          </button>
        </div>
      </form>
  );
};

export default TaskRuleForm;
