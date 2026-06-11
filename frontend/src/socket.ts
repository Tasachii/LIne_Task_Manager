import { io, Socket } from 'socket.io-client';
import { getBoardKey } from './api';

// In dev the frontend runs on a different port than the backend, so point directly to :3000
// In production: same-origin via nginx proxy (/socket.io)
const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

// Lazy initialization so the socket connects after the user has entered the board key (auth.key is sent along)
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, { auth: { key: getBoardKey() } });
  }
  return socket;
}

// Call after changing the board key to reconnect with the new key
export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
