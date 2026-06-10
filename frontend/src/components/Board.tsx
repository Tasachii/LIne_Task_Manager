import { useEffect, useRef, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { COLUMNS, Task, TaskStatus } from '../types';
import { assignTask, fetchTasks, moveTask } from '../api';
import { getSocket } from '../socket';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface Props {
  currentMember: { id: string; name: string };
}

const COLUMN_IDS = COLUMNS.map((c) => c.status) as string[];

export function Board({ currentMember }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const dragging = useRef(false);

  // กดค้างขยับ 5px ก่อนค่อยเริ่มลาก (กดปุ่มในการ์ดได้ปกติ)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetchTasks().then(setTasks).catch((e) => setError(e.message));

    const socket = getSocket();
    const onCreated = (task: Task) => setTasks((prev) => [...prev, task]);
    const onUpdated = (task: Task) =>
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    // ลำดับเปลี่ยนหลายใบพร้อมกัน → ดึงบอร์ดใหม่ (ข้ามถ้ากำลังลากอยู่ กันการ์ดกระตุก)
    const onRefresh = () => {
      if (!dragging.current) fetchTasks().then(setTasks).catch(() => undefined);
    };
    const onDisconnect = () => setOffline(true);
    const onConnect = () => {
      setOffline(false);
      onRefresh(); // ต่อใหม่ได้แล้วดึงสถานะล่าสุดเผื่อพลาด event ไประหว่างหลุด
    };

    socket.on('task:created', onCreated);
    socket.on('task:updated', onUpdated);
    socket.on('tasks:refresh', onRefresh);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    return () => {
      socket.off('task:created', onCreated);
      socket.off('task:updated', onUpdated);
      socket.off('tasks:refresh', onRefresh);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
    };
  }, []);

  // id ที่ลากไป hover อยู่ เป็นได้ทั้งการ์ดและคอลัมน์ (คอลัมน์ว่าง)
  function findColumn(id: string): TaskStatus | undefined {
    if (COLUMN_IDS.includes(id)) return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status;
  }

  function handleDragStart(e: DragStartEvent) {
    dragging.current = true;
    setActiveId(String(e.active.id));
  }

  // ระหว่างลากข้ามคอลัมน์: ย้ายการ์ดใน state ทันทีให้เห็นช่องว่าง
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasks((prev) => {
      const moving = prev.find((t) => t.id === active.id);
      if (!moving) return prev;
      const rest = prev.filter((t) => t.id !== active.id);
      const updated = { ...moving, status: overCol };
      const overIdx = rest.findIndex((t) => t.id === over.id);
      if (overIdx === -1) return [...rest, updated]; // hover บนคอลัมน์เปล่า → ต่อท้าย
      rest.splice(overIdx, 0, updated);
      return rest;
    });
  }

  async function handleDragEnd(e: DragEndEvent) {
    dragging.current = false;
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // จัดลำดับภายในคอลัมน์เดียวกัน (ลากวางบนการ์ดอื่น)
    let next = tasks;
    if (over.id !== active.id && !COLUMN_IDS.includes(String(over.id))) {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask && overTask.status === task.status) {
        const from = tasks.findIndex((t) => t.id === active.id);
        const to = tasks.findIndex((t) => t.id === over.id);
        next = arrayMove(tasks, from, to);
        setTasks(next);
      }
    }

    // ตำแหน่งสุดท้ายในคอลัมน์ → ยิง API (optimistic ไปแล้ว พังค่อยดึงของจริง)
    const index = next.filter((t) => t.status === task.status).findIndex((t) => t.id === task.id);
    try {
      await moveTask(task.id, task.status, Math.max(index, 0));
    } catch (err) {
      setError((err as Error).message);
      fetchTasks().then(setTasks).catch(() => undefined);
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
      {offline && <p className="board__offline">⚠️ ขาดการเชื่อมต่อ realtime — กำลังต่อใหม่…</p>}
      {error && <p className="board__error">{error}</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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
