
import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import Modal from './Modal';
import { Label, Input, Select, Textarea, FormRow } from './UI';

interface EventFormProps {
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id'>, id?: number) => void;
  analystName: string;
  prefilledTitle?: string;
  initialData?: Event | null;
}

const EventForm: React.FC<EventFormProps> = ({ onClose, onSave, analystName, prefilledTitle = '', initialData = null }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Call Mensal');
  const [customType, setCustomType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [registeredBy, setRegisteredBy] = useState(analystName);
  const [nextSteps, setNextSteps] = useState('');

  const isEditing = !!initialData;
  const eventTypes = ['Call Mensal', 'Reunião', 'Visita Técnica', 'Análise de Carteira', 'Outro'];

  useEffect(() => {
    if (isEditing) {
        setDate(new Date(initialData.date).toISOString().split('T')[0]);
        setTitle(initialData.title);
        setDescription(initialData.description);
        setRegisteredBy(initialData.registeredBy);
        setNextSteps(initialData.nextSteps);
        if (eventTypes.includes(initialData.type)) {
            setType(initialData.type);
        } else {
            setType('Outro');
            setCustomType(initialData.type);
        }
    } else {
      setTitle(prefilledTitle);
      setRegisteredBy(analystName);
    }
  }, [initialData, isEditing, prefilledTitle, analystName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = {
      date: new Date(date + 'T12:00:00').toISOString(),
      type: type === 'Outro' ? customType : type,
      title,
      description,
      registeredBy,
      nextSteps,
    };
    onSave(eventData, initialData?.id);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? "Editar Evento" : "Adicionar Novo Evento"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow>
            <div>
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="registeredBy">Analista Responsável</Label>
                <Input id="registeredBy" type="text" value={registeredBy} onChange={e => setRegisteredBy(e.target.value)} required />
            </div>
        </FormRow>

        <FormRow>
             <div>
                <Label htmlFor="type">Tipo de Evento</Label>
                 <Select id="type" value={type} onChange={e => setType(e.target.value)}>
                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>
            {type === 'Outro' ? (
                <div>
                    <Label htmlFor="customType">Especifique o Tipo</Label>
                    <Input id="customType" type="text" value={customType} onChange={e => setCustomType(e.target.value)} required />
                </div>
            ) : <div />}
        </FormRow>
        
        <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
        </div>
        <div>
            <Label htmlFor="nextSteps">Próximos Passos</Label>
            <Textarea id="nextSteps" value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={2} />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {isEditing ? 'Salvar Alterações' : 'Salvar Evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EventForm;
