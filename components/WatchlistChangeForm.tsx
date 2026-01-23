
import React, { useState } from 'react';
import type { Operation, Event, Rating, Sentiment } from '../types';
import { ratingOptions, WatchlistStatus, Sentiment as SentimentEnum } from '../types';
import Modal from './Modal';

interface WatchlistChangeFormProps {
  operation: Operation;
  onClose: () => void;
  onSave: (data: { watchlist: WatchlistStatus, ratingOp: Rating, ratingGroup: Rating, sentiment: Sentiment, event: Omit<Event, 'id'>}) => void;
}

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({ htmlFor, children }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />;
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />;
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />;


const WatchlistChangeForm: React.FC<WatchlistChangeFormProps> = ({ operation, onClose, onSave }) => {
  const [watchlist, setWatchlist] = useState(operation.watchlist);
  const [ratingOp, setRatingOp] = useState(operation.ratingOperation);
  const [ratingGroup, setRatingGroup] = useState(operation.ratingGroup);
  const [description, setDescription] = useState('');
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextSteps, setNextSteps] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment>(SentimentEnum.NEUTRO);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const event: Omit<Event, 'id'> = {
        date: new Date(changeDate).toISOString(),
        type: 'Mudança de Watchlist',
        title: `Alteração de Watchlist para ${watchlist}`,
        description,
        registeredBy: operation.responsibleAnalyst,
        nextSteps: nextSteps,
    };

    onSave({ watchlist, ratingOp, ratingGroup, sentiment, event });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Alterar Watchlist e Ratings">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
            <Label htmlFor="watchlist-date">Data da Alteração</Label>
            <Input id="watchlist-date" type="date" value={changeDate} onChange={e => setChangeDate(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="watchlist-new-status">Novo Status Watchlist</Label>
                <Select id="watchlist-new-status" value={watchlist} onChange={e => setWatchlist(e.target.value as WatchlistStatus)}>
                    {Object.values(WatchlistStatus).map(w => <option key={w} value={w}>{w}</option>)}
                </Select>
            </div>
             <div>
                <Label htmlFor="review-sentiment">Sentimento da Alteração</Label>
                <Select id="review-sentiment" value={sentiment} onChange={e => setSentiment(e.target.value as Sentiment)}>
                    {Object.values(SentimentEnum).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="rating-op-update">Rating Operação (Opcional)</Label>
                <Select id="rating-op-update" value={ratingOp} onChange={e => setRatingOp(e.target.value as Rating)}>
                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            <div>
                <Label htmlFor="rating-group-update">Rating Grupo (Opcional)</Label>
                <Select id="rating-group-update" value={ratingGroup} onChange={e => setRatingGroup(e.target.value as Rating)}>
                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
        </div>

        <div>
            <Label htmlFor="change-description">Descrição / Motivo da Alteração</Label>
            <Textarea id="change-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
        </div>
        
        <div>
            <Label htmlFor="change-next-steps">Próximos Passos</Label>
            <Textarea id="change-next-steps" value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={2} />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar Alteração</button>
        </div>
      </form>
    </Modal>
  );
};

export default WatchlistChangeForm;
