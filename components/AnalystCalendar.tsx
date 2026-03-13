
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Task, Operation } from '../types';
import { TaskStatus } from '../types';
import { CheckCircleIcon } from './icons/Icons';

interface AnalystCalendarProps {
  tasks: Task[];
  operations: Operation[];
  onCompleteTask?: (task: Task) => void;
}

const getAnalystColor = (analystName: string) => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-rose-100 text-rose-800 border-rose-200',
  ];
  let hash = 0;
  for (let i = 0; i < analystName.length; i++) {
    hash = analystName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const AnalystCalendar: React.FC<AnalystCalendarProps> = ({ tasks, operations, onCompleteTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('Todos');
  const [popoverTask, setPopoverTask] = useState<{ task: Task, operationName: string, analyst: string } | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const analysts = useMemo(() => {
    const names = new Set(operations.map(op => op.responsibleAnalyst));
    return ['Todos', ...Array.from(names)];
  }, [operations]);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverTask(null);
        setExpandedDay(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
      days.push(null);
    }
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
    return days;
  }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

  const tasksByDay = useMemo(() => {
    const map = new Map<number, { task: Task; operationName: string; analyst: string }[]>();
    tasks.forEach(task => {
      if (task.status === TaskStatus.COMPLETED) return; // Only show pending/overdue
      
      const operation = operations.find(op => op.id === task.operationId);
      if (!operation) return;
      if (selectedAnalyst !== 'Todos' && operation.responsibleAnalyst !== selectedAnalyst) return;

      const dueDate = new Date(task.dueDate);
      if (dueDate.getMonth() === currentDate.getMonth() && dueDate.getFullYear() === currentDate.getFullYear()) {
        const day = dueDate.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)?.push({ task, operationName: operation.name, analyst: operation.responsibleAnalyst });
      }
    });
    return map;
  }, [tasks, currentDate, operations, selectedAnalyst]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
    setPopoverTask(null);
    setExpandedDay(null);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors shadow-sm border border-gray-200">&larr;</button>
          <h3 className="text-xl font-bold text-gray-800 min-w-[150px] text-center capitalize">
            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => changeMonth(1)} className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors shadow-sm border border-gray-200">&rarr;</button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Analista:</label>
          <select 
            value={selectedAnalyst} 
            onChange={e => setSelectedAnalyst(e.target.value)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-3 pr-8"
          >
            {analysts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {weekDays.map(day => (
          <div key={day} className="text-center font-bold text-gray-500 text-xs py-3 bg-gray-50 uppercase tracking-wider">
            {day}
          </div>
        ))}
        {daysInMonth.map((day, index) => {
          const isToday = isCurrentMonth && day?.getDate() === today.getDate();
          const dayTasks = day ? (tasksByDay.get(day.getDate()) || []) : [];
          const isExpanded = expandedDay === day?.getDate();
          const displayTasks = isExpanded ? dayTasks : dayTasks.slice(0, 2);
          const hiddenCount = dayTasks.length - 2;

          return (
            <div key={index} className={`min-h-[120px] p-2 bg-white transition-colors ${!day ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'}`}>
              {day && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-1.5 relative">
                    {displayTasks.map(({ task, operationName, analyst }) => {
                      const colorClass = getAnalystColor(analyst);
                      const isOverdue = task.status === TaskStatus.OVERDUE;
                      
                      return (
                        <div 
                          key={task.id} 
                          onClick={(e) => { e.stopPropagation(); setPopoverTask({task, operationName, analyst}); setExpandedDay(null); }}
                          className={`px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer border shadow-sm transition-transform hover:scale-[1.02] ${isOverdue ? 'bg-red-50 text-red-700 border-red-200' : colorClass}`}
                        >
                          <div className="truncate font-bold">{task.ruleName}</div>
                          <div className="truncate opacity-80 text-[10px]">{operationName}</div>
                        </div>
                      );
                    })}
                    
                    {!isExpanded && hiddenCount > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExpandedDay(day.getDate()); setPopoverTask(null); }}
                        className="w-full text-left text-xs text-gray-500 font-medium hover:text-blue-600 py-1 pl-1"
                      >
                        + {hiddenCount} tarefas
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Popover for Task Details */}
      {popoverTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div ref={popoverRef} className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-4 py-3 border-b ${popoverTask.task.status === TaskStatus.OVERDUE ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-900 text-lg pr-4">{popoverTask.task.ruleName}</h4>
                <button onClick={() => setPopoverTask(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
              </div>
              <p className="text-sm font-medium text-gray-600 mt-1">{popoverTask.operationName}</p>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Vencimento:</span>
                <span className={`font-semibold ${popoverTask.task.status === TaskStatus.OVERDUE ? 'text-red-600' : 'text-gray-800'}`}>
                  {new Date(popoverTask.task.dueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Analista:</span>
                <span className="font-medium text-gray-800 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getAnalystColor(popoverTask.analyst).split(' ')[0]}`}></span>
                  {popoverTask.analyst}
                </span>
              </div>
              
              {onCompleteTask && (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <button 
                    onClick={() => { onCompleteTask(popoverTask.task); setPopoverTask(null); }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Concluir Tarefa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalystCalendar;

