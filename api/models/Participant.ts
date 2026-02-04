import mongoose, { Schema, Document } from 'mongoose'

export interface IParticipant extends Document {
  sessionId: mongoose.Types.ObjectId
  nickname: string
  avatarUrl?: string
  playerNumber: number
  joinedAt: Date
}

const ParticipantSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  nickname: { type: String, required: true },
  avatarUrl: { type: String },
  playerNumber: { type: Number },
  joinedAt: { type: Date, default: Date.now }
})

export default mongoose.model<IParticipant>('Participant', ParticipantSchema)
