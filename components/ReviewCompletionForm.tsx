
import React, { useState } from 'react';
import type { Task, Operation, Event, Rating, Sentiment } from '../types';
import { ratingOptions, Sentiment as SentimentEnum } from '../types';
import Modal from './Modal';

interface ReviewCompletionFormProps {
  task: Task;
  operation: Operation;
  onClose: () => void;
  onSave: (data: { event: Omit<Event, 'id'>, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment }) => void;
}

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({ htmlFor, children }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />;
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />;
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />;


const ReviewCompletionForm: React.FC<ReviewCompletionFormProps> = ({ task, operation, onClose, onSave }) => {
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [ratingOp, setRatingOp] = useState(operation.ratingOperation);
  const [ratingGroup, setRatingGroup] = useState(operation.ratingGroup);
  const [sentiment, setSentiment] = useState<Sentiment>(SentimentEnum.NEUTRO);
  const [description, setDescription] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const event: Omit<Event, 'id'> = {
      // FIX: Add mid-day time to avoid UTC shift issues
      date: new Date(completionDate + 'T12:00:00').toISOString(),
      type: 'Revisão Periódica',
      title: `Conclusão: ${task.ruleName}`,
      description,
      registeredBy: operation.responsibleAnalyst,
      nextSteps,
    };

    onSave({ event, ratingOp, ratingGroup, sentiment });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Concluir Revisão Periódica: ${operation.name}`}>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        <p><strong>Atenção:</strong> Ao salvar, as próximas revisões pendentes (Gerencial e Política) para esta operação serão marcadas como concluídas.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
            <Label htmlFor="review-completion-date">Data de Conclusão</Label>
            <Input id="review-completion-date" type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <Label htmlFor="review-rating-op">Rating Operação</Label>
                <Select id="review-rating-op" value={ratingOp} onChange={e => setRatingOp(e.target.value as Rating)}>
                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            <div>
                <Label htmlFor="review-rating-group">Rating Grupo</Label>
                <Select id="review-rating-group" value={ratingGroup} onChange={e => setRatingGroup(e.target.value as Rating)}>
                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            <div>
                <Label htmlFor="review-sentiment">Sentimento</Label>
                <Select id="review-sentiment" value={sentiment} onChange={e => setSentiment(e.target.value as Sentiment)}>
                    {Object.values(SentimentEnum).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
            </div>
        </div>

        <div>
            <Label htmlFor="review-description">Descrição / Resumo da Revisão</Label>
            <Textarea id="review-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
        </div>
        <div>
            <Label htmlFor="review-next-steps">Próximos Passos</Label>
            <Textarea id="review-next-steps" value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={2} />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={isSubmitting}>Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Concluir e Salvar Revisão'}
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewCompletionForm;
