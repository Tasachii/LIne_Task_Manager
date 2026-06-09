import { io, Socket } from 'socket.io-client';

// ตอน dev frontend อยู่คนละ port กับ backend จึงชี้ตรงไป :3000
const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export const socket: Socket = io(URL, { autoConnect: true });
