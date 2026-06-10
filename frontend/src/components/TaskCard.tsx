import { useSortable } from '@dnd-kit/sortable';
import { Task } from '../types';

interface Props {
  task: Task;
  onAssign: (task: Task) => void;
  overlay?: boolean; // การ์ดที่ลอยตามเมาส์ตอนลาก
}

// กำหนดส่งเลยมาแล้วและงานยังไม่เสร็จ → เตือนแดง
function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

export function TaskCard({ task, onAssign, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging && !overlay ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${overlay ? 'card--overlay' : ''}`}
      {...listeners}
      {...attributes}
    >
      <p className="card__title">{task.title}</p>
      {task.description !== task.title && (
        <p className="card__desc">{task.description}</p>
      )}
      {(task.priority || task.due_date) && (
        <div className="card__badges">
          {task.priority && (
            <span className={`badge badge--${task.priority}`}>
              {task.priority === 'high' ? '🔥 ด่วน' : task.priority === 'low' ? 'ไม่เร่ง' : 'ปกติ'}
            </span>
          )}
          {task.due_date && (
            <span className={`badge badge--due ${isOverdue(task) ? 'badge--overdue' : ''}`}>
              📅 {task.due_date.slice(0, 10)}
            </span>
          )}
        </div>
      )}
      <div className="card__meta">
        {task.assignee_id ? (
          <span className="card__assignee">● {task.assignee_name ?? task.assignee_id}</span>
        ) : (
          <button
            className="card__take"
            onClick={(e) => {
              e.stopPropagation();
              onAssign(task);
            }}
            onPointerDown={(e) => e.stopPropagation()} // กันไม่ให้กลายเป็นลาก
          >
            รับงาน
          </button>
        )}
      </div>
    </div>
  );
}
