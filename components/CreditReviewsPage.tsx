
import React, { useState, useMemo, useEffect } from 'react';
import type { Operation, Task, Area, OperationReviewNote } from '../types';
import { TaskStatus } from '../types';
import { PencilIcon, CheckCircleIcon } from './icons/Icons';

interface CreditReviewsPageProps {
  operations: Operation[];
  onUpdateOperation: (updatedOperation: Operation) => void;
  onCompleteReview: (task: Task) => void;
  apiUrl: string;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const CreditReviewsPage: React.FC<CreditReviewsPageProps> = ({ operations, onUpdateOperation, onCompleteReview, apiUrl, showToast }) => {
  // Filters
  const [analystFilter, setAnalystFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState<'All' | Area>('All');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  
  // In-line editing state
  const [editingOpId, setEditingOpId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  const analysts = useMemo(() => ['All', ...new Set(operations.map(op => op.responsibleAnalyst))], [operations]);

  const filteredOperations = useMemo(() => {
    return operations
        .filter(op => {
            if (analystFilter !== 'All' && op.responsibleAnalyst !== analystFilter) return false;
            if (areaFilter !== 'All' && op.area !== areaFilter) return false;
            if (dateFilter.start || dateFilter.end) {
                const gerencialDate = op.nextReviewGerencialTask ? new Date(op.nextReviewGerencialTask.dueDate) : null;
                const politicaDate = op.nextReviewPoliticaTask ? new Date(op.nextReviewPoliticaTask.dueDate) : null;
                const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
                const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
                
                if(startDate) startDate.setHours(0,0,0,0);
                if(endDate) endDate.setHours(23,59,59,999);
                
                const hasMatchingDate = 
                    (gerencialDate && (!startDate || gerencialDate >= startDate) && (!endDate || gerencialDate <= endDate)) ||
                    (politicaDate && (!startDate || politicaDate >= startDate) && (!endDate || politicaDate <= endDate));

                if (!hasMatchingDate) return false;
            }
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [operations, analystFilter, areaFilter, dateFilter]);

  const handleStartEditing = (op: Operation) => {
      setEditingOpId(op.id);
      setEditingNotes(op.notes || '');
  };

  const handleCancelEditing = () => {
      setEditingOpId(null);
      setEditingNotes('');
  };

  const handleSaveNote = async () => {
      if (!editingOpId) return;
      
      const opToUpdate = operations.find(op => op.id === editingOpId);
      if (!opToUpdate) return;

      try {
        const response = await fetch(`${apiUrl}/api/operation_review_notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operationId: editingOpId,
                notes: editingNotes,
                userName: opToUpdate.responsibleAnalyst
            }),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao salvar a observação.');

        const savedNote = await response.json();
        
        // Optimistic UI update
        const updatedOperation = { ...opToUpdate, notes: savedNote.notes };
        onUpdateOperation(updatedOperation);

        showToast('Observação salva com sucesso!', 'success');
      } catch (error) {
          console.error(error);
          showToast('Erro ao salvar observação.', 'error');
      } finally {
          handleCancelEditing();
      }
  };

  const getStatusBadge = (dueDate: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = (due.getTime() - today.getTime()) / (1000 * 3600 * 24);

      if (diffDays < 0) {
          return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Atrasada</span>;
      }
      if (diffDays <= 7) {
          return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Próxima</span>;
      }
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">No Prazo</span>;
  };

  const ReviewInfoCell: React.FC<{ task: Task | null | undefined }> = ({ task }) => {
    if (!task) {
        return <span className="text-gray-400">N/A</span>;
    }
    return (
        <div className="flex items-center gap-2">
            <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
            {getStatusBadge(task.dueDate)}
        </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Painel de Revisões de Crédito</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label htmlFor="analyst-filter" className="text-sm font-medium text-gray-700">Analista</label>
                <select id="analyst-filter" value={analystFilter} onChange={e => setAnalystFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                    {analysts.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="area-filter" className="text-sm font-medium text-gray-700">Área</label>
                <select id="area-filter" value={areaFilter} onChange={e => setAreaFilter(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                    <option value="All">Todas</option>
                    <option value="CRI">CRI</option>
                    <option value="Capital Solutions">Capital Solutions</option>
                </select>
            </div>
            <div>
                <label htmlFor="start-date-filter" className="text-sm font-medium text-gray-700">Vencimento De</label>
                <input type="date" id="start-date-filter" value={dateFilter.start} onChange={e => setDateFilter(prev => ({...prev, start: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
            </div>
             <div>
                <label htmlFor="end-date-filter" className="text-sm font-medium text-gray-700">Vencimento Até</label>
                <input type="date" id="end-date-filter" value={dateFilter.end} onChange={e => setDateFilter(prev => ({...prev, end: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operação</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analista</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próx. Rev. Gerencial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próx. Rev. Política</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Observações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOperations.map(op => {
                        const gerencialTask = op.nextReviewGerencialTask;
                        const politicaTask = op.nextReviewPoliticaTask;
                        let taskForCompletion: Task | null = null;

                        if (gerencialTask && politicaTask) {
                            taskForCompletion = new Date(gerencialTask.dueDate) <= new Date(politicaTask.dueDate) ? gerencialTask : politicaTask;
                        } else {
                            taskForCompletion = gerencialTask || politicaTask || null;
                        }

                        return (
                            <tr key={op.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{op.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.responsibleAnalyst}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <ReviewInfoCell task={gerencialTask} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <ReviewInfoCell task={politicaTask} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {taskForCompletion ? (
                                        <button
                                            onClick={() => onCompleteReview(taskForCompletion!)}
                                            className="flex items-center justify-center gap-1.5 w-full max-w-[120px] px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                        >
                                            <CheckCircleIcon className="w-4 h-4" /> Completar
                                        </button>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {editingOpId === op.id ? (
                                        <div>
                                            <textarea
                                                value={editingNotes}
                                                onChange={(e) => setEditingNotes(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                rows={3}
                                            />
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={handleSaveNote} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Salvar</button>
                                                <button onClick={handleCancelEditing} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">Cancelar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between">
                                            <p className="whitespace-pre-wrap flex-1">{op.notes}</p>
                                            <button onClick={() => handleStartEditing(op)} className="ml-2 text-gray-400 hover:text-blue-600 flex-shrink-0">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredOperations.length === 0 && (
                 <div className="text-center py-8 text-gray-500">
                    Nenhuma operação encontrada para os filtros selecionados.
                </div>
            )}
        </div>
    </div>
  );
};

export default CreditReviewsPage;
