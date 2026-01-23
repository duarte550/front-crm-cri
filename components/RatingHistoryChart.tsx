
import React from 'react';
import type { RatingHistoryEntry, Rating } from '../types';
import { ratingOptions } from '../types';

interface RatingHistoryChartProps {
    history: RatingHistoryEntry[];
}

const RatingHistoryChart: React.FC<RatingHistoryChartProps> = ({ history }) => {
    if (!history || history.length < 1) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500">Nenhum dado para exibir o gráfico.</p>
            </div>
        );
    }

    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // SVG Dimensions and Padding
    const svgWidth = 500;
    const svgHeight = 300;
    const padding = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    // Y-Axis Scale (Categorical - Rating)
    const yDomain = ratingOptions;
    const yScale = (rating: Rating) => {
        const index = yDomain.indexOf(rating);
        if (index === -1) return null;
        // Corrected calculation: Higher index (worse rating) should result in a larger Y value (further down).
        return (index / (yDomain.length - 1)) * chartHeight;
    };

    // X-Axis Scale (Time)
    const firstDate = new Date(sortedHistory[0].date).getTime();
    const lastDate = sortedHistory.length > 1 ? new Date(sortedHistory[sortedHistory.length - 1].date).getTime() : firstDate;
    const dateRange = lastDate - firstDate;

    const xScale = (dateStr: string) => {
        if (dateRange === 0) return chartWidth / 2; // Center if only one date
        const date = new Date(dateStr).getTime();
        return ((date - firstDate) / dateRange) * chartWidth;
    };

    const createPath = (ratingKey: 'ratingOperation' | 'ratingGroup') => {
        return sortedHistory
            .map(entry => {
                const x = xScale(entry.date);
                const y = yScale(entry[ratingKey]);
                return y !== null ? `${x},${y}` : null;
            })
            .filter(Boolean)
            .join(' ');
    };

    const operationPath = createPath('ratingOperation');
    const groupPath = createPath('ratingGroup');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                <g transform={`translate(${padding.left}, ${padding.top})`}>
                    {/* Y-Axis Labels and Grid Lines */}
                    {yDomain.map((rating, i) => {
                        const y = yScale(rating);
                        if (y === null) return null;
                        return (
                            <g key={rating}>
                                <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" />
                                <text x={-10} y={y} dy="0.32em" textAnchor="end" className="text-xs fill-gray-500">
                                    {rating}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis Labels and Grid Lines */}
                    {sortedHistory.map((entry, i) => {
                        const x = xScale(entry.date);
                        return (
                             <g key={`x-label-${i}`} transform={`translate(${x}, ${chartHeight})`}>
                                <line y2={5} stroke="#9ca3af"></line>
                                <text y={20} textAnchor="middle" className="text-xs fill-gray-500">
                                    {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </text>
                            </g>
                        )
                    })}
                    
                    {/* Data Lines */}
                    <polyline points={operationPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
                    <polyline points={groupPath} fill="none" stroke="#16a34a" strokeWidth="2" />
                    
                    {/* Data Points */}
                    {sortedHistory.map((entry, i) => {
                        const opY = yScale(entry.ratingOperation);
                        const groupY = yScale(entry.ratingGroup);
                        const x = xScale(entry.date);
                        return (
                            <React.Fragment key={`point-${i}`}>
                                {opY !== null && <circle cx={x} cy={opY} r="4" fill="#3b82f6" />}
                                {groupY !== null && <circle cx={x} cy={groupY} r="4" fill="#16a34a" />}
                            </React.Fragment>
                        );
                    })}
                </g>
            </svg>
            {/* Legend */}
            <div className="flex justify-center items-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Rating Operação</span>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                    <span className="text-gray-600">Rating Grupo</span>
                </div>
            </div>
        </div>
    );
};

export default RatingHistoryChart;
