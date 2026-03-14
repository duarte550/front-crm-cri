
import React, { useMemo, useState } from 'react';
import type { Operation, Area } from '../types';
import { Page } from '../types';
import { HomeIcon, BriefcaseIcon, ClipboardCheckIcon, HistoryIcon, BellIcon, DocumentSearchIcon, SyncIcon } from './icons/Icons';

interface SidebarProps {
  operations: Operation[];
  currentPage: Page;
  selectedOperationId: number | null;
  onNavigate: (page: Page, operationId?: number) => void;
  onSyncRules: () => void;
  selectedArea: Area | 'Mixed';
  isBatchMode: boolean;
  onToggleBatchMode: () => void;
  onSaveBatch: () => void;
  onDiscardBatch: () => void;
  pendingBatchCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ operations, currentPage, selectedOperationId, onNavigate, onSyncRules, selectedArea, isBatchMode, onToggleBatchMode, onSaveBatch, onDiscardBatch, pendingBatchCount }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({});

  const filteredOperationsList = useMemo(() => {
    let list = operations;
    if (selectedArea !== 'Mixed') {
      list = list.filter(op => op.area === selectedArea);
    }
    if (searchTerm) {
      list = list.filter(op => op.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [operations, selectedArea, searchTerm]);

  const groupedOperations = useMemo(() => {
    return filteredOperationsList.reduce((acc, op) => {
      const area = op.area || 'CRI';
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(op);
      return acc;
    }, {} as Record<Area, Operation[]>);
  }, [filteredOperationsList]);

  const toggleArea = (area: string) => {
    setCollapsedAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const NavLink: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    isSubItem?: boolean;
    className?: string;
  }> = ({ onClick, isActive, children, isSubItem = false, className = '' }) => (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-md transition-all duration-200 ${
        isSubItem ? 'pl-9 pr-2 py-1.5 text-xs' : 'px-4 py-2'
      } ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen border-r border-gray-800 shadow-xl">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          Navegação
        </h2>
      </div>
      
      <nav className="flex-1 flex flex-col min-h-0">
        <div className="p-3 space-y-1">
          <NavLink
            onClick={() => onNavigate(Page.OVERVIEW)}
            isActive={currentPage === Page.OVERVIEW}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">Resumo Geral</span>
          </NavLink>

          <NavLink
            onClick={() => onNavigate(Page.ANALYST_HUB)}
            isActive={currentPage === Page.ANALYST_HUB}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="font-medium">Hub do Analista</span>
          </NavLink>

          <NavLink
            onClick={() => onNavigate(Page.TASKS)}
            isActive={currentPage === Page.TASKS}
          >
            <ClipboardCheckIcon className="w-5 h-5" />
            <span className="font-medium">Tarefas</span>
          </NavLink>
          
          <NavLink
            onClick={() => onNavigate(Page.CREDIT_REVIEWS)}
            isActive={currentPage === Page.CREDIT_REVIEWS}
          >
            <DocumentSearchIcon className="w-5 h-5" />
            <span className="font-medium">Revisões</span>
          </NavLink>

          <NavLink
            onClick={() => onNavigate(Page.WATCHLIST)}
            isActive={currentPage === Page.WATCHLIST}
          >
            <BellIcon className="w-5 h-5" />
            <span className="font-medium">Watchlist</span>
          </NavLink>

          <NavLink
            onClick={() => onNavigate(Page.AUDIT_LOG)}
            isActive={currentPage === Page.AUDIT_LOG}
          >
            <HistoryIcon className="w-5 h-5" />
            <span className="font-medium">Auditoria</span>
          </NavLink>
        </div>

        <div className="px-4 py-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar operação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 pl-3 pr-8 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
          {Object.keys(groupedOperations).sort().map(area => (
            <div key={area} className="mt-4 first:mt-2">
              <button 
                onClick={() => toggleArea(area)}
                className="w-full flex items-center justify-between px-2 mb-1 group"
              >
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
                  {area}
                </h3>
                <span className={`text-[10px] text-gray-600 transition-transform duration-200 ${collapsedAreas[area] ? '-rotate-90' : ''}`}>
                  ▼
                </span>
              </button>
              
              {!collapsedAreas[area] && (
                <div className="space-y-0.5">
                  {groupedOperations[area as Area].map(op => (
                    <NavLink
                      key={op.id}
                      onClick={() => onNavigate(Page.DETAIL, op.id)}
                      isActive={currentPage === Page.DETAIL && selectedOperationId === op.id}
                      isSubItem
                    >
                      <BriefcaseIcon className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate">{op.name}</span>
                    </NavLink>
                  ))}
                  {groupedOperations[area as Area].length === 0 && (
                    <p className="pl-9 text-[10px] text-gray-600 italic py-1">Nenhuma operação</p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {Object.keys(groupedOperations).length === 0 && (
            <div className="mt-8 text-center px-4">
              <p className="text-xs text-gray-500">Nenhuma operação encontrada para "{searchTerm}"</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-800 bg-gray-900/50 space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-medium text-gray-300">Modo Edição em Lote</span>
              <button 
                onClick={onToggleBatchMode}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isBatchMode ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isBatchMode ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {isBatchMode && (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-700/50">
                <div className="text-[10px] text-gray-400 text-center font-medium">
                  {pendingBatchCount} alteração(ões) pendente(s)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSaveBatch}
                    disabled={pendingBatchCount === 0}
                    className="flex-1 py-1.5 bg-green-600/90 text-white text-xs font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={onDiscardBatch}
                    disabled={pendingBatchCount === 0}
                    className="flex-1 py-1.5 bg-red-600/90 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onSyncRules}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-medium text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all border border-blue-500/20"
          >
            <SyncIcon className="w-4 h-4" />
            <span>Sincronizar Regras</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;