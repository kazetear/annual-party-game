import mongoose, { Schema, Document } from 'mongoose'

export interface IWinner extends Document {
  sessionId: mongoose.Types.ObjectId
  participantId: mongoose.Types.ObjectId
  roundNumber: number
  prizeRank?: number
  wonAt: Date
}

const WinnerSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  roundNumber: { type: Number, required: true },
  prizeRank: { type: Number },
  wonAt: { type: Date, default: Date.now }
})

export default mongoose.model<IWinner>('Winner', WinnerSchema)
