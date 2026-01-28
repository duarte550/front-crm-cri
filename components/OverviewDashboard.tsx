
import React, { useState, useMemo } from 'react';
import type { Operation, Area } from '../types';
import { WatchlistStatus } from '../types';
import OperationForm from './OperationForm';
import AnalystCalendar from './AnalystCalendar';
import { PlusCircleIcon, EyeIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import Modal from './Modal';

interface OverviewDashboardProps {
  operations: Operation[];
  onSelectOperation: (id: number) => void;
  onAddOperation: (newOperationData: any) => void;
  onOpenNewTaskModal: (operationId: number) => void;
  onDeleteOperation: (id: number) => void;
}

type SortField = 'name' | 'maturityDate' | 'nextReviewGerencial' | 'nextReviewPolitica';
type SortDirection = 'asc' | 'desc';

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
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
        const datePart = dateString.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length !== 3) return 'Data Inválida';
        
        const [year, month, day] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        
        if (isNaN(date.getTime())) return 'Data Inválida';
        
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error("Erro ao formatar data:", dateString, e);
        return 'Erro na Data';
    }
};


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ operations, onSelectOperation, onAddOperation, onOpenNewTaskModal, onDeleteOperation }) => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [operationToDelete, setOperationToDelete] = useState<Operation | null>(null);
  const [areaFilter, setAreaFilter] = useState<'All' | Area>('All');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{field: SortField, direction: SortDirection}>({
      field: 'name',
      direction: 'asc'
  });

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredOperations = useMemo(() => {
    let result = [...operations];
    
    if (areaFilter !== 'All') {
      result = result.filter(op => op.area === areaFilter);
    }

    result.sort((a, b) => {
        let valA: any = a[sortConfig.field as keyof Operation];
        let valB: any = b[sortConfig.field as keyof Operation];

        // Normalização para datas
        if (['maturityDate', 'nextReviewGerencial', 'nextReviewPolitica'].includes(sortConfig.field)) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else {
            valA = (valA || "").toString().toLowerCase();
            valB = (valB || "").toString().toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [operations, areaFilter, sortConfig]);

  const allTasks = React.useMemo(() => {
      return operations.flatMap(op => op.tasks || []);
  }, [operations]);

  const confirmDelete = () => {
    if (operationToDelete) {
      onDeleteOperation(operationToDelete.id);
      setOperationToDelete(null); 
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
      if (sortConfig.field !== field) return <div className="w-4 h-4 text-gray-300 ml-1 inline-block opacity-20"><ArrowUpIcon /></div>;
      return sortConfig.direction === 'asc' 
          ? <ArrowUpIcon className="w-4 h-4 text-blue-600 ml-1 inline-block" /> 
          : <ArrowDownIcon className="w-4 h-4 text-blue-600 ml-1 inline-block" />;
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
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Nome da Operação <SortIcon field="name" />
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('maturityDate')}
                >
                  Vencimento <SortIcon field="maturityDate" />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating Op.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watchlist</th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nextReviewGerencial')}
                >
                  Próx. Rev. Gerencial <SortIcon field="nextReviewGerencial" />
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nextReviewPolitica')}
                >
                  Próx. Rev. Política <SortIcon field="nextReviewPolitica" />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Tarefas Atrasadas</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">{formatDate(op.maturityDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.ratingOperation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><WatchlistBadge status={currentStatus} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(op.nextReviewGerencial)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(op.nextReviewPolitica)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={op.overdueCount > 0 ? 'bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold' : 'text-green-600'}>
                        {op.overdueCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center gap-4">
                          <button onClick={() => onOpenNewTaskModal(op.id)} className="text-gray-600 hover:text-blue-600 font-semibold text-xs bg-gray-100 px-2 py-1 rounded">
                              + Tarefa
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
