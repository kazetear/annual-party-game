import { Link } from 'react-router-dom'
import { PartyPopper, Trophy } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-5xl md:text-7xl font-bold mb-12 text-yellow-300 drop-shadow-lg text-center tracking-wider">
        年会互动游戏
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link 
          to="/golden-egg"
          className="group relative bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform shadow-xl cursor-pointer border-4 border-yellow-200"
        >
          <div className="bg-white/20 p-6 rounded-full group-hover:bg-white/30 transition-colors">
            <PartyPopper size={64} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-red-900">砸金蛋</h2>
          <p className="text-red-800 text-center font-medium">
            幸运抽奖，惊喜不断
          </p>
        </Link>

        <Link 
          to="/horse-racing"
          className="group relative bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform shadow-xl cursor-pointer border-4 border-green-300"
        >
          <div className="bg-white/20 p-6 rounded-full group-hover:bg-white/30 transition-colors">
            <Trophy size={64} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">赛马竞技</h2>
          <p className="text-green-100 text-center font-medium">
            摇一摇，冲刺冠军
          </p>
        </Link>
      </div>

      <footer className="mt-16 text-red-200/60 text-sm">
        © 2026 年会筹备组
      </footer>
    </div>
  )
}
