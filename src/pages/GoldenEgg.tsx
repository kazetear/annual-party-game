import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hammer, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { API_BASE as BASE_URL } from '@/config'

const API_BASE = BASE_URL + '/golden-egg'

export default function GoldenEgg() {
  const [step, setStep] = useState<'setup' | 'playing' | 'finished'>('setup')
  const [sessionId, setSessionId] = useState<string>('')
  const [totalParticipants, setTotalParticipants] = useState(57)
  const [currentRound, setCurrentRound] = useState(1)
  const [winners, setWinners] = useState<any[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [roundWinners, setRoundWinners] = useState<any[]>([])

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF4500']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF4500']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  const startSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalParticipants })
      })
      const data = await res.json()
      if (data.sessionId) {
        setSessionId(data.sessionId)
        setStep('playing')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to start session')
    }
  }

  const drawWinners = async () => {
    setIsDrawing(true)
    setRoundWinners([]) // Clear previous round display
    
    // Fake animation delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const res = await fetch(`${API_BASE}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, roundNumber: currentRound })
      })
      const data = await res.json()
      
      if (data.winners) {
        setRoundWinners(data.winners)
        setWinners(prev => [...prev, ...data.winners.map((w: any) => ({ ...w, round: currentRound }))])
        triggerConfetti()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to draw winners')
    } finally {
      setIsDrawing(false)
    }
  }

  const nextRound = () => {
    if (currentRound >= 4) {
      setStep('finished')
    } else {
      setCurrentRound(prev => prev + 1)
      setRoundWinners([])
    }
  }

  return (
    <div className="min-h-screen bg-[#8B0000] text-yellow-300 font-sans flex flex-col items-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <header className="w-full max-w-6xl flex justify-between items-center py-6 border-b border-yellow-500/30 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hammer className="text-yellow-400" /> 金蛋大抽奖
        </h1>
        <div className="text-yellow-100/80">
            {step === 'playing' && `第 ${currentRound} / 4 轮`}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-900/80 p-12 rounded-3xl border-4 border-yellow-500 shadow-2xl text-center backdrop-blur-sm"
            >
              <h2 className="text-4xl font-bold mb-8 text-white">设置参与人数</h2>
              <div className="flex items-center justify-center gap-4 mb-8">
                <input 
                  type="number" 
                  value={totalParticipants}
                  onChange={(e) => setTotalParticipants(Number(e.target.value))}
                  className="bg-red-950 text-yellow-300 text-5xl font-bold text-center w-48 py-4 rounded-xl border-2 border-yellow-600 focus:outline-none focus:border-yellow-300"
                />
                <span className="text-2xl text-yellow-200">人</span>
              </div>
              <p className="text-yellow-200/60 mb-8 text-sm">
                * 系统将自动过滤包含数字 4 的号码
              </p>
              <button 
                onClick={startSession}
                className="bg-gradient-to-b from-yellow-300 to-yellow-600 text-red-900 text-2xl font-bold py-4 px-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                开始游戏
              </button>
            </motion.div>
          )}

          {step === 'playing' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-12 relative">
                <div className={`text-9xl font-bold transition-all duration-300 ${isDrawing ? 'scale-110 blur-sm text-yellow-100' : 'text-yellow-400'}`}>
                  {isDrawing ? '???' : (roundWinners.length > 0 ? '🎉' : 'Ready')}
                </div>
                {isDrawing && (
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Sparkles size={120} className="text-yellow-200 opacity-50" />
                    </motion.div>
                )}
              </div>

              {roundWinners.length > 0 ? (
                <div className="w-full text-center">
                  <h3 className="text-3xl font-bold text-white mb-8">恭喜本轮中奖者</h3>
                  <div className="grid grid-cols-5 gap-4 mb-12">
                    {roundWinners.map((winner, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-yellow-100 text-red-800 rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-yellow-300"
                      >
                        {winner.number}
                      </motion.div>
                    ))}
                  </div>
                  <button 
                    onClick={nextRound}
                    className="bg-yellow-500 text-red-900 text-xl font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition-colors"
                  >
                    {currentRound < 4 ? '进入下一轮' : '查看最终结果'}
                  </button>
                </div>
              ) : (
                <button 
                    onClick={drawWinners}
                    disabled={isDrawing}
                    className="bg-gradient-to-b from-red-500 to-red-700 text-white text-3xl font-bold py-6 px-16 rounded-2xl shadow-xl border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50"
                >
                    {isDrawing ? '正在砸蛋...' : '砸金蛋'}
                </button>
              )}
            </motion.div>
          )}

          {step === 'finished' && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
            >
                <h2 className="text-4xl font-bold text-center text-white mb-12">🎉 所有中奖名单 🎉</h2>
                <div className="grid grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(round => (
                        <div key={round} className="bg-red-900/50 rounded-xl p-6 border border-yellow-500/30">
                            <h3 className="text-xl font-bold text-yellow-300 mb-4 text-center border-b border-yellow-500/30 pb-2">第 {round} 轮</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {winners.filter(w => w.round === round).map(w => (
                                    <div key={w.number} className="bg-yellow-100/90 text-red-800 text-center font-bold rounded p-2">
                                        {w.number}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="text-yellow-300 hover:text-white underline"
                    >
                        返回首页
                    </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
