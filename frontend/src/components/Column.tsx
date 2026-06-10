import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface Props {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onAssign: (task: Task) => void;
}

export function Column({ status, label, tasks, onAssign }: Props) {
  // droppable ไว้รองรับคอลัมน์ว่าง (SortableContext เปล่าๆ ไม่มีพื้นที่ให้วาง)
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className={`col col--${status}`}>
      <header className="col__head">
        <span className="col__label">{label}</span>
        <span className="col__count">{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`col__drop ${isOver ? 'col__drop--over' : ''}`}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onAssign={onAssign} />
          ))}
          {tasks.length === 0 && <p className="col__empty">— ว่าง —</p>}
        </div>
      </SortableContext>
    </section>
  );
}
