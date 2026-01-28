
import React, { useState, useMemo } from 'react';
import type { Operation, Area } from '../types';
import { WatchlistStatus } from '../types';
import OperationForm from './OperationForm';
import AnalystCalendar from './AnalystCalendar';
import { PlusCircleIcon, EyeIcon, TrashIcon } from './icons/Icons';
import Modal from './Modal';

interface OverviewDashboardProps {
  operations: Operation[];
  onSelectOperation: (id: number) => void;
  onAddOperation: (newOperationData: any) => void;
  onOpenNewTaskModal: (operationId: number) => void;
  onDeleteOperation: (id: number) => void;
}

const WatchlistBadge: React.FC<{ status: WatchlistStatus }> = ({ status }) => {
  const colorClasses = {
    [WatchlistStatus.VERDE]: 'bg-green-100 text-green-800',
    [WatchlistStatus.AMARELO]: 'bg-yellow-100 text-yellow-800',
    [WatchlistStatus.ROSA]: 'bg-pink-100 text-pink-800',
    [WatchlistStatus.VERMELHO]: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status]}`}>
      {status}
    </span>
  );
};

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    // FIX: Split ISO string and take only date parts to avoid UTC time shift issues
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    // Create date using local parameters (month is 0-indexed)
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
};


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ operations, onSelectOperation, onAddOperation, onOpenNewTaskModal, onDeleteOperation }) => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [operationToDelete, setOperationToDelete] = useState<Operation | null>(null);
  const [areaFilter, setAreaFilter] = useState<'All' | Area>('All');
  
  const filteredOperations = useMemo(() => {
    if (areaFilter === 'All') {
      return operations;
    }
    return operations.filter(op => op.area === areaFilter);
  }, [operations, areaFilter]);

  const allTasks = React.useMemo(() => {
      return operations.flatMap(op => op.tasks || []);
  }, [operations]);

  const confirmDelete = () => {
    if (operationToDelete) {
      onDeleteOperation(operationToDelete.id);
      setOperationToDelete(null); 
    }
  };

  return (
    <div className="space-y-8">
      {isFormOpen && (
        <OperationForm 
            onClose={() => setIsFormOpen(false)} 
            onSave={onAddOperation} 
        />
      )}

      {operationToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setOperationToDelete(null)}
          title={`Deletar Operação: ${operationToDelete.name}`}
        >
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              Você tem certeza que deseja deletar esta operação?
            </p>
            <p className="text-sm text-red-600 font-semibold mb-6">
              Todos os eventos, tarefas e históricos associados serão permanentemente removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setOperationToDelete(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirmar Deleção
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Resumo de Operações</h2>
          <div className="flex items-center gap-4">
             <div>
                <label htmlFor="area-filter" className="sr-only">Filtrar por Área</label>
                <select 
                  id="area-filter"
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value as 'All' | Area)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    <option value="All">Todas as Áreas</option>
                    <option value="CRI">CRI</option>
                    <option value="Capital Solutions">Capital Solutions</option>
                </select>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Adicionar Operação</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Operação</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating Op.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watchlist</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próx. Rev. Gerencial</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próx. Rev. Política</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarefas Atrasadas</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOperations.map((op) => {
                const latestHistoryEntry = op.ratingHistory.length > 0
                  ? [...op.ratingHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                  : null;
                const currentStatus = latestHistoryEntry?.watchlist ?? op.watchlist;

                return (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{op.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.ratingOperation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><WatchlistBadge status={currentStatus} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(op.nextReviewGerencial)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(op.nextReviewPolitica)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={op.overdueCount > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                        {op.overdueCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center gap-4">
                          <button onClick={() => onOpenNewTaskModal(op.id)} className="text-gray-600 hover:text-blue-600 font-semibold">
                              Adicionar Tarefa
                          </button>
                          <button onClick={() => onSelectOperation(op.id)} className="flex items-center gap-1 text-blue-600 hover:text-blue-900 font-semibold">
                              <EyeIcon className="w-5 h-5" /> Detalhes
                          </button>
                          <button
                              onClick={() => setOperationToDelete(op)}
                              className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                              title="Deletar Operação"
                          >
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            {filteredOperations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Nenhuma operação cadastrada para os filtros selecionados.
                </div>
            )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Calendário do Analista (Mês Atual)</h2>
        <AnalystCalendar tasks={allTasks} operations={operations} />
      </div>
    </div>
  );
};

export default OverviewDashboard;
