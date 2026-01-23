
import React, { useMemo } from 'react';
import type { Operation, Area } from '../types';
import { Page } from '../types';
import { HomeIcon, BriefcaseIcon, ClipboardCheckIcon, HistoryIcon, BellIcon, DocumentSearchIcon } from './icons/Icons';

interface SidebarProps {
  operations: Operation[];
  currentPage: Page;
  selectedOperationId: number | null;
  onNavigate: (page: Page, operationId?: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ operations, currentPage, selectedOperationId, onNavigate }) => {

  const groupedOperations = useMemo(() => {
    return operations.reduce((acc, op) => {
      const area = op.area || 'CRI'; // Default to CRI if area is not set
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(op);
      return acc;
    }, {} as Record<Area, Operation[]>);
  }, [operations]);


  const NavLink: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    isSubItem?: boolean;
  }> = ({ onClick, isActive, children, isSubItem = false }) => (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-md transition-colors duration-200 ${
        isSubItem ? 'pl-10 pr-2 py-2 text-sm' : 'px-4 py-2.5'
      } ${
        isActive
          ? 'bg-gray-700 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Navegação</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavLink
          onClick={() => onNavigate(Page.OVERVIEW)}
          isActive={currentPage === Page.OVERVIEW}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Resumo Geral</span>
        </NavLink>

        <NavLink
          onClick={() => onNavigate(Page.TASKS)}
          isActive={currentPage === Page.TASKS}
        >
          <ClipboardCheckIcon className="w-5 h-5" />
          <span>Gerenciador de Tarefas</span>
        </NavLink>
        
         <NavLink
          onClick={() => onNavigate(Page.CREDIT_REVIEWS)}
          isActive={currentPage === Page.CREDIT_REVIEWS}
        >
          <DocumentSearchIcon className="w-5 h-5" />
          <span>Revisões de Crédito</span>
        </NavLink>

         <NavLink
          onClick={() => onNavigate(Page.WATCHLIST)}
          isActive={currentPage === Page.WATCHLIST}
        >
          <BellIcon className="w-5 h-5" />
          <span>Watchlist</span>
        </NavLink>

        <NavLink
          onClick={() => onNavigate(Page.AUDIT_LOG)}
          isActive={currentPage === Page.AUDIT_LOG}
        >
          <HistoryIcon className="w-5 h-5" />
          <span>Log de Auditoria</span>
        </NavLink>
        
        <div className="pt-2">
            {Object.keys(groupedOperations).sort().map(area => (
              <div key={area} className="mt-2">
                 <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{area}</h3>
                 <div className="mt-1 space-y-1">
                    {groupedOperations[area as Area].map(op => (
                        <NavLink
                            key={op.id}
                            onClick={() => onNavigate(Page.DETAIL, op.id)}
                            isActive={currentPage === Page.DETAIL && selectedOperationId === op.id}
                            isSubItem
                        >
                            <BriefcaseIcon className="w-4 h-4" />
                            <span className="truncate">{op.name}</span>
                        </NavLink>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;