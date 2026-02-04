import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/annual-party'

export async function initDb() {
  try {
    if (MONGODB_URI.includes('localhost')) {
        console.warn('⚠️ Warning: Using "localhost" in Mongoose connection string. If connection fails, try using "127.0.0.1".')
    }
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

export function getDb() {
    return mongoose.connection
}
