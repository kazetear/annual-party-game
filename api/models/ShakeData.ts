import mongoose, { Schema, Document } from 'mongoose'

export interface IShakeData extends Document {
  participantId: mongoose.Types.ObjectId
  intensity: number
  timestamp: number
}

const ShakeDataSchema = new Schema({
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  intensity: { type: Number, required: true },
  timestamp: { type: Number, required: true }
}, { timestamps: true })

export default mongoose.model<IShakeData>('ShakeData', ShakeDataSchema)
