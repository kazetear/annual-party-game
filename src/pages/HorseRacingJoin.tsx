import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { API_BASE as BASE_URL } from '@/config'

const API_BASE = BASE_URL + '/horse-racing'

export default function HorseRacingJoin() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, nickname })
      })
      const data = await res.json()
      
      if (data.status === 'joined') {
        // Store session info
        localStorage.setItem('horse_racing_player', JSON.stringify({
            gameId,
            playerId: data.participantId,
            nickname
        }))
        navigate(`/game/${gameId}`)
      } else {
        alert('加入失败: ' + (data.error || '未知错误'))
      }
    } catch (err) {
      console.error(err)
      alert('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-4 rounded-full">
                <User size={48} className="text-white" />
            </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">加入赛马</h1>
        <p className="text-green-200 text-center mb-8">输入你的昵称参与比赛</p>
        
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              微信昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-black/20 border border-green-500/50 rounded-xl px-4 py-3 text-lg text-white placeholder-green-300/50 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              placeholder="例如：张三"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-green-900 font-bold text-xl py-4 rounded-xl shadow-lg hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? '正在加入...' : '立即加入'}
          </button>
        </form>
      </div>
    </div>
  )
}
