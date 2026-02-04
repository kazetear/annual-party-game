import mongoose, { Schema, Document } from 'mongoose'

export interface IGameSession extends Document {
  type: 'golden-egg' | 'horse-racing'
  status: 'waiting' | 'active' | 'completed'
  totalParticipants: number
  settings: any
  createdAt: Date
  updatedAt: Date
}

const GameSessionSchema = new Schema({
  type: { type: String, required: true, enum: ['golden-egg', 'horse-racing'] },
  status: { type: String, default: 'waiting', enum: ['waiting', 'active', 'completed'] },
  totalParticipants: { type: Number, required: true },
  settings: { type: Schema.Types.Mixed }, // JSON equivalent
}, { timestamps: true })

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema)
