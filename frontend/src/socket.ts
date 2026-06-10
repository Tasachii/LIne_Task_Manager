import { io, Socket } from 'socket.io-client';
import { getBoardKey } from './api';

// ตอน dev frontend อยู่คนละ port กับ backend จึงชี้ตรงไป :3000
// production: same-origin ผ่าน nginx proxy (/socket.io)
const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

// สร้างแบบ lazy เพื่อให้ connect "หลัง" ผู้ใช้ใส่รหัสบอร์ดแล้ว (ส่ง auth.key ไปด้วย)
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, { auth: { key: getBoardKey() } });
  }
  return socket;
}

// เรียกหลังเปลี่ยนรหัส เพื่อ reconnect ด้วย key ใหม่
export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
