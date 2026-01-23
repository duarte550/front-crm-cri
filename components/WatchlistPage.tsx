
import React, { useState, useMemo } from 'react';
import type { Operation, RatingHistoryEntry, Event, Rating, Sentiment as SentimentType, WatchlistStatus as WatchlistStatusType } from '../types';
import { WatchlistStatus, Sentiment, ratingOptions } from '../types';
import { BellIcon, ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from './icons/Icons';
import WatchlistChangeForm from './WatchlistChangeForm';
import WatchlistHistoryChart from './WatchlistHistoryChart';


interface WatchlistPageProps {
  operations: Operation[];
  onUpdateOperation: (updatedOperation: Operation) => void;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ operations, onUpdateOperation }) => {
    const [activeFilter, setActiveFilter] = useState<WatchlistStatus | 'All'>('All');
    const [expandedOpId, setExpandedOpId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [operationToEdit, setOperationToEdit] = useState<Operation | null>(null);
    
    const filterOptions: (WatchlistStatus | 'All')[] = ['All', ...Object.values(WatchlistStatus)];

    const filteredOperations = useMemo(() => {
        // This initial filter uses the derived current status for accuracy.
        return operations.filter(op => {
            if (activeFilter === 'All') return true;
            const latestHistoryEntry = op.ratingHistory.length > 0
                ? [...op.ratingHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                : null;
            const currentStatus = latestHistoryEntry?.watchlist ?? op.watchlist;
            return currentStatus === activeFilter;
        });
    }, [operations, activeFilter]);

    const handleOpenModal = (op: Operation) => {
        setOperationToEdit(op);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setOperationToEdit(null);
        setIsModalOpen(false);
    };
    
    const handleSaveChanges = (data: Parameters<typeof onUpdateOperation>[0]) => {
        onUpdateOperation(data);
        handleCloseModal();
    };

    const handleSaveWatchlistChange = (op: Operation, data: { watchlist: WatchlistStatusType, ratingOp: Rating, ratingGroup: Rating, sentiment: SentimentType, event: Omit<Event, 'id'>}) => {
        const newEventId = Date.now();
        const eventToSave: Event = { ...data.event, id: newEventId };
        
        const newHistoryEntry: RatingHistoryEntry = {
            id: Date.now() + 1,
            date: eventToSave.date,
            ratingOperation: data.ratingOp,
            ratingGroup: data.ratingGroup,
            watchlist: data.watchlist,
            sentiment: data.sentiment, // Use manually selected sentiment
            eventId: newEventId,
        };

        const updatedOp = {
            ...op,
            watchlist: data.watchlist,
            ratingOperation: data.ratingOp,
            ratingGroup: data.ratingGroup,
            events: [...op.events, eventToSave],
            ratingHistory: [...op.ratingHistory, newHistoryEntry],
        };
        handleSaveChanges(updatedOp);
    };

    return (
        <div className="space-y-8">
            {isModalOpen && operationToEdit && (
                <WatchlistChangeForm
                    operation={operationToEdit}
                    onClose={handleCloseModal}
                    onSave={(data) => handleSaveWatchlistChange(operationToEdit, data)}
                />
            )}

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Gerenciamento de Watchlist</h2>
                
                <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-4">
                    {filterOptions.map(status => (
                        <button
                            key={status}
                            onClick={() => setActiveFilter(status)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                activeFilter === status
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'All' ? 'Todas' : status}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {filteredOperations.map(op => (
                        <OperationCard 
                            key={op.id}
                            operation={op}
                            isExpanded={expandedOpId === op.id}
                            onToggle={() => setExpandedOpId(prev => prev === op.id ? null : op.id)}
                            onOpenUpdateModal={() => handleOpenModal(op)}
                        />
                    ))}
                    {filteredOperations.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Nenhuma operação encontrada para o filtro "{activeFilter}".</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <WatchlistHistoryChart operations={operations} />
            </div>
        </div>
    );
};

const WatchlistBadge: React.FC<{ status: WatchlistStatusType | null }> = ({ status }) => {
    if (!status) return null;
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


interface OperationCardProps {
    operation: Operation;
    isExpanded: boolean;
    onToggle: () => void;
    onOpenUpdateModal: () => void;
}

const OperationCard: React.FC<OperationCardProps> = ({ operation, isExpanded, onToggle, onOpenUpdateModal }) => {
    const sortedHistory = useMemo(() => {
        return [...operation.ratingHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [operation.ratingHistory]);

    const currentWatchlistStatus = useMemo(() => {
        return sortedHistory[0]?.watchlist ?? operation.watchlist;
    }, [sortedHistory, operation.watchlist]);

    const statusClasses = {
        [WatchlistStatus.VERDE]: { border: 'border-green-500', bg: 'bg-green-50' },
        [WatchlistStatus.AMARELO]: { border: 'border-yellow-500', bg: 'bg-yellow-50' },
        [WatchlistStatus.ROSA]: { border: 'border-pink-500', bg: 'bg-pink-50' },
        [WatchlistStatus.VERMELHO]: { border: 'border-red-500', bg: 'bg-red-50' },
    };

    const previousWatchlistStatus = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const relevantHistory = operation.ratingHistory
            .filter(h => new Date(h.date) < startOfThisMonth)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return relevantHistory.length > 0 ? relevantHistory[0].watchlist : null;
    }, [operation.ratingHistory]);

    return (
        <div className={`border-l-4 rounded-r-lg shadow-sm transition-all duration-300 ${statusClasses[currentWatchlistStatus].border} ${isExpanded ? statusClasses[currentWatchlistStatus].bg : 'bg-white'}`}>
            <div 
                className="p-4 cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900">{operation.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-700 mt-1">
                            <span>Analista: <span className="font-medium">{operation.responsibleAnalyst}</span></span>
                            <span>Rating Op: <span className="font-medium">{operation.ratingOperation}</span></span>
                            <span>Rating Grupo: <span className="font-medium">{operation.ratingGroup}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-xs text-gray-500">Mês Anterior</p>
                            {previousWatchlistStatus ? (
                                <WatchlistBadge status={previousWatchlistStatus} />
                            ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    N/A
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-gray-500">Farol Atual</p>
                           <WatchlistBadge status={currentWatchlistStatus} />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onOpenUpdateModal(); }} className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm font-semibold">
                            <BellIcon className="w-4 h-4" /> Alterar Status
                        </button>
                        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </span>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 bg-white/50 space-y-4">
                    <h4 className="font-semibold text-gray-700">Histórico de Alterações</h4>
                    {sortedHistory.length > 0 ? (
                        sortedHistory.map((entry, index) => {
                            const event = operation.events.find(e => e.id === entry.eventId);
                            const previousEntry = sortedHistory[index + 1];

                            const prevStatus = previousEntry?.watchlist;
                            const statusChanged = prevStatus && prevStatus !== entry.watchlist;

                            const prevRatingOp = previousEntry?.ratingOperation;
                            const ratingOpChanged = prevRatingOp && prevRatingOp !== entry.ratingOperation;

                            const prevRatingGroup = previousEntry?.ratingGroup;
                            const ratingGroupChanged = prevRatingGroup && prevRatingGroup !== entry.ratingGroup;

                            return (
                                <div key={entry.id} className="p-3 border rounded-md bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold text-gray-800 text-base w-24">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                                            <div className="flex flex-col items-start text-sm space-y-1">
                                                {/* Watchlist change */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 w-12 text-right">Farol:</span>
                                                    {statusChanged ? (
                                                        <span className="flex items-center gap-1.5"><WatchlistBadge status={prevStatus} /><span className="font-bold text-gray-700 mx-1">→</span><WatchlistBadge status={entry.watchlist} /></span>
                                                    ) : (
                                                        <WatchlistBadge status={entry.watchlist} />
                                                    )}
                                                </div>
                                                {/* Rating Op change */}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <span className="text-gray-500 w-12 text-right">Op:</span>
                                                    {ratingOpChanged ? (
                                                        <span className="flex items-center gap-1.5"><span className="font-mono bg-gray-100 px-1 rounded">{prevRatingOp}</span><span className="font-bold text-gray-700 mx-1">→</span><span className="font-mono bg-gray-100 px-1 rounded font-semibold">{entry.ratingOperation}</span></span>
                                                    ) : (
                                                        <span className="font-mono bg-gray-100 px-1 rounded font-semibold">{entry.ratingOperation}</span>
                                                    )}
                                                </div>
                                                {/* Rating Group change */}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <span className="text-gray-500 w-12 text-right">Grupo:</span>
                                                    {ratingGroupChanged ? (
                                                         <span className="flex items-center gap-1.5"><span className="font-mono bg-gray-100 px-1 rounded">{prevRatingGroup}</span><span className="font-bold text-gray-700 mx-1">→</span><span className="font-mono bg-gray-100 px-1 rounded font-semibold">{entry.ratingGroup}</span></span>
                                                    ) : (
                                                        <span className="font-mono bg-gray-100 px-1 rounded font-semibold">{entry.ratingGroup}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 font-semibold text-sm ${entry.sentiment === 'Positivo' ? 'text-green-600' : entry.sentiment === 'Negativo' ? 'text-red-600' : 'text-gray-600'}`}>
                                            {entry.sentiment === 'Positivo' && <ArrowUpIcon className="w-4 h-4" />}
                                            {entry.sentiment === 'Neutro' && <ArrowRightIcon className="w-4 h-4" />}
                                            {entry.sentiment === 'Negativo' && <ArrowDownIcon className="w-4 h-4" />}
                                            {entry.sentiment}
                                        </div>
                                    </div>
                                    {event && (
                                        <div className="border-t border-gray-200 pt-3 text-sm text-gray-800 space-y-2">
                                            <p><strong className="font-semibold text-gray-600">Evento:</strong> {event.title}</p>
                                            <p>{event.description}</p>
                                            {event.nextSteps && <p><strong className="font-semibold text-gray-600">Próximos Passos:</strong> {event.nextSteps}</p>}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-4">Nenhum histórico de alteração para esta operação.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;
