import { Server, Socket } from 'socket.io'

let ioInstance: Server | null = null

export function setupSocket(io: Server) {
  ioInstance = io
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join_game', async (data) => {
      // data: { gameId, nickname, avatar }
      console.log('Player joining socket room:', data)
      try {
        socket.join(data.gameId)
        // Do NOT emit player_joined here, let the API handle it to avoid duplicates
      } catch (error) {
        console.error('Error in join_game:', error)
      }
    })

    socket.on('shake', async (data) => {
      // data: { gameId, playerId, intensity }
      // Broadcast shake event to the game room (for 3D display)
      io.to(data.gameId).emit('player_moved', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}

export function getIO() {
  if (!ioInstance) {
    console.warn("Socket.io not initialized yet!")
    return null
  }
  return ioInstance
}
