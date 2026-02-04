import express from 'express'
import GameSession from '../models/GameSession.js'
import Participant from '../models/Participant.js'
import Winner from '../models/Winner.js'

const router = express.Router()

// Create Game Session
router.post('/create', async (req, res) => {
  try {
    const { totalParticipants, rounds = 4, perRoundCount = 15 } = req.body
    
    if (!totalParticipants) {
      return res.status(400).json({ error: 'totalParticipants is required' })
    }

    // Generate valid numbers (exclude numbers containing 4)
    const validNumbers: number[] = []
    let currentNum = 1
    while (validNumbers.length < totalParticipants) {
      if (!currentNum.toString().includes('4')) {
        validNumbers.push(currentNum)
      }
      currentNum++
    }

    const settings = {
      rounds,
      perRoundCount,
      validNumbers
    }

    const session = await GameSession.create({
      type: 'golden-egg',
      status: 'waiting',
      totalParticipants,
      settings
    })

    // Pre-populate participants
    const participantsData = validNumbers.map(num => ({
      sessionId: session._id,
      nickname: `Number ${num}`,
      playerNumber: num
    }))

    await Participant.insertMany(participantsData)

    res.json({
      sessionId: session._id,
      status: 'created',
      totalValidNumbers: validNumbers.length
    })

  } catch (error) {
    console.error('Error creating golden egg session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Draw Winners
router.post('/draw', async (req, res) => {
  try {
    const { sessionId, roundNumber } = req.body

    if (!sessionId || !roundNumber) {
      return res.status(400).json({ error: 'sessionId and roundNumber are required' })
    }

    const session = await GameSession.findById(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const perRoundCount = session.settings.perRoundCount || 15

    // Get existing winners for this session
    const existingWinners = await Winner.find({ sessionId }).select('participantId')
    const winnerIds = existingWinners.map(w => w.participantId)

    // Find eligible participants
    const eligibleParticipants = await Participant.find({
      sessionId,
      _id: { $nin: winnerIds }
    })

    if (eligibleParticipants.length === 0) {
      // If no eligible participants, check if we should just return empty or error
      // But if we generated enough numbers, this shouldn't happen unless we run out
      return res.status(400).json({ error: 'No eligible participants left' })
    }

    // Randomly select winners
    const winnersCount = Math.min(perRoundCount, eligibleParticipants.length)
    const winners: any[] = []
    const selectedIndices = new Set<number>()

    while (winners.length < winnersCount) {
      const randomIndex = Math.floor(Math.random() * eligibleParticipants.length)
      if (!selectedIndices.has(randomIndex)) {
        selectedIndices.add(randomIndex)
        winners.push(eligibleParticipants[randomIndex])
      }
    }

    // Save winners
    const winnersData = winners.map(w => ({
      sessionId,
      participantId: w._id,
      roundNumber
    }))

    await Winner.insertMany(winnersData)

    // Format response
    const formattedWinners = winners.map(w => ({
      number: w.playerNumber,
      name: w.nickname
    }))

    res.json({
      round: roundNumber,
      winners: formattedWinners,
      remainingCount: eligibleParticipants.length - winnersCount
    })

  } catch (error) {
    console.error('Error drawing winners:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get Session Info
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params
        const session = await GameSession.findById(sessionId)
        if (!session) return res.status(404).json({ error: 'Session not found' })
        
        // Get winners so far
        const winners = await Winner.find({ sessionId })
            .populate('participantId')
            .sort({ roundNumber: 1, wonAt: 1 })

        const formattedWinners = winners.map(w => {
            const p = w.participantId as any
            return {
                number: p.playerNumber,
                name: p.nickname,
                round: w.roundNumber
            }
        })

        res.json({
            session,
            winners: formattedWinners
        })
    } catch (error) {
        console.error('Error getting session:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
