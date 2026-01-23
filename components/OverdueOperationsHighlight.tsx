
import React from 'react';
import type { Operation } from '../types';
import { Page } from '../types';
import { WarningIcon } from './icons/Icons';

interface OverdueOperationsHighlightProps {
  operations: Operation[];
  onNavigate: (page: Page, operationId?: number) => void;
}

const OverdueOperationsHighlight: React.FC<OverdueOperationsHighlightProps> = ({ operations, onNavigate }) => {
  const overdueOperations = React.useMemo(() => {
    return operations
      .filter(op => op.overdueCount > 0)
      .sort((a, b) => b.overdueCount - a.overdueCount);
  }, [operations]);

  if (overdueOperations.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md shadow-md mb-6" role="alert">
      <div className="flex">
        <div className="py-1">
          <WarningIcon className="w-6 h-6 text-red-500 mr-4" />
        </div>
        <div>
          <p className="font-bold">Atenção: Há operações com tarefas atrasadas!</p>
          <ul className="mt-2 list-disc list-inside text-sm">
            {overdueOperations.map(op => (
              <li key={op.id}>
                <button onClick={() => onNavigate(Page.DETAIL, op.id)} className="font-semibold hover:underline">
                  {op.name}
                </button>
                : <span className="font-normal"> {op.overdueCount} tarefa(s) atrasada(s).</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OverdueOperationsHighlight;