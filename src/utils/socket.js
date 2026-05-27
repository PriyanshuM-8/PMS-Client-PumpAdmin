import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null
let currentUserId = null

export const connectSocket = (userId, onConnected) => {
  if (!userId) return
  currentUserId = userId

  // Already connected — just rejoin room
  if (socket?.connected) {
    socket.emit('join', userId)
    onConnected?.()
    return
  }

  // Socket exists but disconnected — destroy it
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000,
  })

  socket.on('connect', () => {
    socket.emit('join', userId)
    onConnected?.()
  })

  socket.on('reconnect', () => {
    if (currentUserId) socket.emit('join', currentUserId)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] connect_error:', err.message)
  })
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  currentUserId = null
}

export const getSocket = () => socket
