import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { COLUMNS, Task, TaskStatus } from '../types';
import { assignTask, fetchTasks, updateStatus } from '../api';
import { socket } from '../socket';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface Props {
  currentMember: { id: string; name: string };
}

export function Board({ currentMember }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // กดค้างขยับ 5px ก่อนค่อยเริ่มลาก (กดปุ่มในการ์ดได้ปกติ)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetchTasks().then(setTasks).catch((e) => setError(e.message));

    // realtime: มี task ใหม่ / มีการอัปเดต
    const onCreated = (task: Task) => setTasks((prev) => [...prev, task]);
    const onUpdated = (task: Task) =>
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));

    socket.on('task:created', onCreated);
    socket.on('task:updated', onUpdated);
    return () => {
      socket.off('task:created', onCreated);
      socket.off('task:updated', onUpdated);
    };
  }, []);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overStatus = e.over?.id as TaskStatus | undefined;
    if (!overStatus) return;

    const task = tasks.find((t) => t.id === e.active.id);
    if (!task || task.status === overStatus) return;

    // optimistic update ก่อน แล้วค่อยยิง API
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: overStatus } : t)));
    try {
      await updateStatus(task.id, overStatus);
    } catch (err) {
      setError((err as Error).message);
      fetchTasks().then(setTasks); // พังก็ดึงของจริงมาใหม่
    }
  }

  async function handleAssign(task: Task) {
    try {
      await assignTask(task.id, currentMember.id, currentMember.name);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  return (
    <>
      {error && <p className="board__error">{error}</p>}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="board">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={tasks.filter((t) => t.status === col.status)}
              onAssign={handleAssign}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onAssign={() => {}} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
