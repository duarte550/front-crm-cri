
import React, { useState, useMemo } from 'react';
import type { Event } from '../types';
import { PlusCircleIcon, PencilIcon, DownloadIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';

interface EventHistoryProps {
  events: Event[];
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  onDownloadEvent: (event: Event) => void;
  dateFilter: { start: string; end: string };
  onDateFilterChange: (filter: { start: string; end: string }) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  personFilter: string;
  onPersonFilterChange: (person: string) => void;
  uniqueEventTypes: string[];
  uniqueRegisteredBy: string[];
  expandedEventId: number | null;
  onToggleExpand: (id: number | null) => void;
  eventRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
}

const EventHistory: React.FC<EventHistoryProps> = ({
  events,
  onAddEvent,
  onEditEvent,
  onDownloadEvent,
  dateFilter,
  onDateFilterChange,
  typeFilter,
  onTypeFilterChange,
  personFilter,
  onPersonFilterChange,
  uniqueEventTypes,
  uniqueRegisteredBy,
  expandedEventId,
  onToggleExpand,
  eventRefs,
}) => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedEvents = useMemo(() => {
      return [...events].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [events, sortDirection]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-700">Histórico de Eventos</h3>
        <button onClick={onAddEvent} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusCircleIcon className="w-5 h-5" /> Adicionar Evento
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">De:</label>
            <input type="date" id="start-date" value={dateFilter.start} onChange={e => onDateFilterChange({ ...dateFilter, start: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </div>
          <div>
            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">Até:</label>
            <input type="date" id="end-date" value={dateFilter.end} onChange={e => onDateFilterChange({ ...dateFilter, end: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </div>
          <div>
            <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">Tipo:</label>
            <select id="type-filter" value={typeFilter} onChange={e => onTypeFilterChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
              {uniqueEventTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="person-filter" className="text-sm font-medium text-gray-700">Responsável:</label>
            <select id="person-filter" value={personFilter} onChange={e => onPersonFilterChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
              {uniqueRegisteredBy.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg text-xs font-bold text-gray-500 uppercase">
            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
                Data {sortDirection === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
            </div>
            <div>Tipo</div>
            <div className="col-span-2">Título</div>
            <div className="text-right">Ações</div>
        </div>
        {sortedEvents.map(event => (
          <div key={event.id} ref={el => { if (el) eventRefs.current[event.id] = el; }} className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${expandedEventId === event.id ? 'bg-blue-50 ring-2 ring-blue-300' : ''}`}>
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="text-sm font-medium text-gray-600">{new Date(event.date).toLocaleDateString('pt-BR')}</div>
              <div className="text-sm text-gray-800"><span className="font-semibold">{event.type}</span></div>
              <div className="col-span-2 text-sm text-gray-800 font-medium">{event.title}</div>
              <div className="text-right flex items-center justify-end gap-2">
                <button onClick={() => onEditEvent(event)} className="text-gray-400 hover:text-blue-600" title="Editar Evento">
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDownloadEvent(event)} className="text-gray-400 hover:text-green-600" title="Baixar Evento como .txt">
                  <DownloadIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onToggleExpand(expandedEventId === event.id ? null : event.id)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold ml-2">
                  {expandedEventId === event.id ? 'Menos' : 'Mais'}
                </button>
              </div>
            </div>
            {expandedEventId === event.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm text-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <p><strong className="font-semibold text-gray-600">Descrição:</strong> {event.description}</p>
                <p><strong className="font-semibold text-gray-600">Registrado por:</strong> {event.registeredBy}</p>
                <p><strong className="font-semibold text-gray-600">Próximos Passos:</strong> {event.nextSteps || 'Nenhum'}</p>
                {event.completedTaskId && <p className="text-xs text-gray-400 italic pt-2 border-t mt-2">ID Tarefa Concluída: {event.completedTaskId}</p>}
              </div>
            )}
          </div>
        ))}
        {sortedEvents.length === 0 && <p className="text-center text-gray-500 py-12">Nenhum evento encontrado para os filtros selecionados.</p>}
      </div>
    </div>
  );
};

export default EventHistory;
