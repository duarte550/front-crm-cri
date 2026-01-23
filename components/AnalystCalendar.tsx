
import React, { useState, useMemo } from 'react';
import type { Task, Operation } from '../types';
import { TaskStatus } from '../types';

interface AnalystCalendarProps {
  tasks: Task[];
  operations: Operation[];
}

const AnalystCalendar: React.FC<AnalystCalendarProps> = ({ tasks, operations }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = useMemo(() => {
    const days = [];
    // Add blank days for the start of the week
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
      days.push(null);
    }
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
    return days;
  }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

  const tasksByDay = useMemo(() => {
    const map = new Map<number, { task: Task; operationName: string; }[]>();
    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      if (dueDate.getMonth() === currentDate.getMonth() && dueDate.getFullYear() === currentDate.getFullYear()) {
        const day = dueDate.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        const operation = operations.find(op => op.id === task.operationId);
        map.get(day)?.push({ task, operationName: operation?.name || 'N/A' });
      }
    });
    return map;
  }, [tasks, currentDate, operations]);

  const changeMonth = (offset: number) => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(prev.getMonth() + offset);
          return newDate;
      })
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">&larr;</button>
            <h3 className="text-lg font-semibold">
                {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
                <div key={day} className="text-center font-bold text-gray-500 text-sm py-2">{day}</div>
            ))}
            {daysInMonth.map((day, index) => (
                <div key={index} className={`border rounded-md h-32 p-1.5 overflow-y-auto ${!day ? 'bg-gray-50' : 'bg-white'}`}>
                    {day && (
                        <>
                            <div className="font-semibold text-sm text-gray-600">{day.getDate()}</div>
                            <div className="mt-1 space-y-1">
                                {tasksByDay.get(day.getDate())?.map(({ task, operationName }) => (
                                    <div key={task.id} className={`p-1 rounded text-xs text-white ${task.status === TaskStatus.OVERDUE ? 'bg-red-500' : 'bg-blue-500'}`} title={`${operationName}: ${task.ruleName}`}>
                                       <p className="truncate">{task.ruleName}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default AnalystCalendar;
