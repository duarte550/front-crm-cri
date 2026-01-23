
import React, { useMemo, useState } from 'react';
import type { Operation } from '../types';
import { WatchlistStatus } from '../types';

interface WatchlistHistoryChartProps {
    operations: Operation[];
}

// Helper to get the last day of a given month
const getEndOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

// Corrected helper to get the watchlist status of an operation at a specific point in time
const getStatusForMonth = (operation: Operation, monthEndDate: Date): WatchlistStatus | null => {
    if (!operation.ratingHistory || operation.ratingHistory.length === 0) {
        return null;
    }

    // Find the earliest entry to determine creation date
    const creationEntry = operation.ratingHistory.reduce((earliest, current) => 
        new Date(current.date) < new Date(earliest.date) ? current : earliest
    );

    // If the month we are checking is before the operation was created, it had no status.
    if (monthEndDate < new Date(creationEntry.date)) {
        return null; 
    }

    const relevantHistory = operation.ratingHistory
        .filter(h => new Date(h.date) <= monthEndDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // This will now correctly return the most recent status for that month, or the initial status if it existed before.
    return relevantHistory.length > 0 ? relevantHistory[0].watchlist : creationEntry.watchlist;
};

const TimePeriodButton: React.FC<{
    label: string;
    value: number;
    currentValue: number;
    onClick: (value: number) => void;
}> = ({ label, value, currentValue, onClick }) => (
    <button
        onClick={() => onClick(value)}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
            currentValue === value 
            ? 'bg-blue-600 text-white shadow' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
        {label}
    </button>
);


const WatchlistHistoryChart: React.FC<WatchlistHistoryChartProps> = ({ operations }) => {
    const [monthsToShow, setMonthsToShow] = useState(4);

    const months = useMemo(() => {
        const monthLabels: { name: string; endDate: Date }[] = [];
        const today = new Date();
        for (let i = monthsToShow - 1; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            monthLabels.push({
                name: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
                endDate: getEndOfMonth(date),
            });
        }
        return monthLabels;
    }, [monthsToShow]);

    const chartData = useMemo(() => {
        return operations.map(op => ({
            operationName: op.name,
            statuses: months.map(month => getStatusForMonth(op, month.endDate)),
        }));
    }, [operations, months]);

    const statusColorClasses: Record<WatchlistStatus, string> = {
        [WatchlistStatus.VERDE]: 'bg-green-500',
        [WatchlistStatus.AMARELO]: 'bg-yellow-400',
        [WatchlistStatus.ROSA]: 'bg-pink-500',
        [WatchlistStatus.VERMELHO]: 'bg-red-600',
    };

    if (operations.length === 0) {
        return <p className="text-center text-gray-500 py-4">Nenhuma operação para exibir no gráfico.</p>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-gray-800">Histórico Mensal de Watchlist</h2>
                 <div className="flex items-center gap-2">
                    <TimePeriodButton label="4M" value={4} currentValue={monthsToShow} onClick={setMonthsToShow} />
                    <TimePeriodButton label="6M" value={6} currentValue={monthsToShow} onClick={setMonthsToShow} />
                    <TimePeriodButton label="12M" value={12} currentValue={monthsToShow} onClick={setMonthsToShow} />
                 </div>
            </div>
            <div className="overflow-x-auto p-2">
                <div className="inline-block min-w-full">
                    <div className="grid gap-x-4" style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${months.length}, minmax(80px, 1fr))` }}>
                        {/* Header */}
                        <div className="font-semibold text-gray-600 pb-2">Operação</div>
                        {months.map(month => (
                            <div key={month.name} className="font-semibold text-gray-600 text-center pb-2 capitalize">{month.name}</div>
                        ))}

                        {/* Body */}
                        {chartData.map(({ operationName, statuses }) => (
                            <React.Fragment key={operationName}>
                                <div className="py-3 border-t border-gray-200 text-sm font-medium text-gray-800 truncate" title={operationName}>{operationName}</div>
                                {statuses.map((status, index) => (
                                    <div key={index} className="py-3 border-t border-gray-200 flex items-center justify-center">
                                        {status ? (
                                            <div className={`w-6 h-6 rounded-full border-2 border-black/20 ${statusColorClasses[status]}`} title={status}></div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-200" title="N/A"></div>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchlistHistoryChart;
