import express from 'express'
import GameSession from '../models/GameSession.js'
import Participant from '../models/Participant.js'
import Winner from '../models/Winner.js'
import { getIO } from '../socket.js'

const router = express.Router()

// Create Game Session
router.post('/create', async (req, res) => {
  try {
    const { totalParticipants = 60 } = req.body
    
    const settings = {
      duration: 10, // 10 seconds race
    }

    const session = await GameSession.create({
      type: 'horse-racing',
      status: 'waiting',
      totalParticipants,
      settings
    })

    res.json({
      sessionId: session._id,
      status: 'created'
    })

  } catch (error) {
    console.error('Error creating horse racing session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Join Game
router.post('/join', async (req, res) => {
  try {
    const { gameId, nickname, avatar } = req.body
    
    if (!gameId || !nickname) {
      return res.status(400).json({ error: 'gameId and nickname are required' })
    }

    // Check if session exists
    const session = await GameSession.findById(gameId)
    if (!session) {
      return res.status(404).json({ error: 'Game session not found' })
    }

    // Get current participant count
    const count = await Participant.countDocuments({ sessionId: gameId })
    const playerNumber = count + 1

    const participant = await Participant.create({
      sessionId: gameId,
      nickname,
      avatarUrl: avatar || '',
      playerNumber
    })

    const io = getIO()
    if (io) {
      io.to(gameId).emit('player_joined', {
        id: participant._id,
        nickname,
        avatar,
        playerNumber
      })
    }

    res.json({
      participantId: participant._id,
      playerNumber,
      status: 'joined'
    })

  } catch (error) {
    console.error('Error joining horse racing:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start Game
router.post('/start', async (req, res) => {
  try {
    const { gameId } = req.body
    
    await GameSession.findByIdAndUpdate(gameId, { status: 'active' })

    const io = getIO()
    if (io) {
      io.to(gameId).emit('game_start', { timestamp: Date.now() })
    }

    res.json({ status: 'started' })

  } catch (error) {
    console.error('Error starting horse racing:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Shake (API fallback)
router.post('/shake', async (req, res) => {
  try {
    const { gameId, playerId, intensity } = req.body
    
    const io = getIO()
    if (io) {
      io.to(gameId).emit('player_moved', { playerId, intensity })
    }

    res.json({ status: 'ok' })
  } catch (error) {
    console.error('Error in shake:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get Session Info
router.get('/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params
        const session = await GameSession.findById(gameId)
        if (!session) return res.status(404).json({ error: 'Session not found' })
        
        const participants = await Participant.find({ sessionId: gameId })

        res.json({
            session,
            participants
        })
    } catch (error) {
        console.error('Error getting session:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Save Results
router.post('/finish', async (req, res) => {
    try {
        const { gameId, rankings } = req.body // rankings: [{ participantId, rank, time }]
        
        await GameSession.findByIdAndUpdate(gameId, { status: 'completed' })

        const winnersData = rankings.map((rank: any) => {
            let prizeRank = 0
            if (rank.rank === 1) prizeRank = 1
            else if (rank.rank === 2) prizeRank = 2
            else if (rank.rank === 3) prizeRank = 3
            else if (rank.rank <= 20) prizeRank = 4
            else prizeRank = 5 // 21-57

            return {
                sessionId: gameId,
                participantId: rank.participantId,
                roundNumber: 1, // Horse racing is 1 round
                prizeRank
            }
        })

        await Winner.insertMany(winnersData)
        
        res.json({ status: 'finished' })

    } catch (error) {
        console.error('Error finishing game:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
