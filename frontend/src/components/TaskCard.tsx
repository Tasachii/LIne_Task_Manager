import { useDraggable } from '@dnd-kit/core';
import { Task } from '../types';

interface Props {
  task: Task;
  onAssign: (task: Task) => void;
  overlay?: boolean; // การ์ดที่ลอยตามเมาส์ตอนลาก
}

export function TaskCard({ task, onAssign, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // ขยับการ์ดตามเมาส์เอง (ไม่ต้องพึ่ง @dnd-kit/utilities)
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
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
