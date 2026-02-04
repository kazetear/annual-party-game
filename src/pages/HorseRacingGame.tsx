import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { Smartphone, Trophy } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Loader } from '@react-three/drei'
import { SOCKET_URL } from '@/config'
import { Horse3D } from '@/components/Horse3D'

export default function HorseRacingGame() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState<any>(null)
  const [status, setStatus] = useState<'waiting' | 'racing' | 'finished'>('waiting')
  const [shakeCount, setShakeCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  
  // Shake detection refs
  const lastUpdate = useRef(0)
  const lastAcc = useRef({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    // Load player from storage
    const stored = localStorage.getItem('horse_racing_player')
    if (!stored) {
      navigate(`/join/${gameId}`)
      return
    }
    const p = JSON.parse(stored)
    if (p.gameId !== gameId) {
        navigate(`/join/${gameId}`)
        return
    }
    setPlayer(p)

    // Connect Socket
    const socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        timeout: 5000,
        transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
        setIsConnected(true)
        socket.emit('join_game', { ...p, gameId })
    })

    socket.on('disconnect', () => {
        setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err)
        setIsConnected(false)
    })

    socket.on('game_start', () => {
        setStatus('racing')
        if (navigator.vibrate) navigator.vibrate(500)
    })

    return () => {
        socket.disconnect()
    }
  }, [gameId, navigate])

  const [localCountdown, setLocalCountdown] = useState(3)
  const [canShake, setCanShake] = useState(false)

  useEffect(() => {
    if (status === 'racing') {
        const timer = setInterval(() => {
            setLocalCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setCanShake(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    } else {
        setLocalCountdown(3)
        setCanShake(false)
    }
  }, [status])

  // Shake Logic
  const requestPermission = async () => {
    // @ts-ignore
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        // @ts-ignore
        const permissionState = await DeviceMotionEvent.requestPermission()
        if (permissionState === 'granted') {
          // Permission granted
        } else {
          alert('需要授权才能使用摇一摇功能')
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    if (status !== 'racing' || !canShake) return

    const handleMotion = (event: DeviceMotionEvent) => {
        const current = event.accelerationIncludingGravity
        if (!current) return

        const time = Date.now()
        if ((time - lastUpdate.current) > 100) {
            const diff = time - lastUpdate.current
            lastUpdate.current = time

            const x = current.x || 0
            const y = current.y || 0
            const z = current.z || 0
            
            const lx = lastAcc.current.x
            const ly = lastAcc.current.y
            const lz = lastAcc.current.z

            // Better formula: sum of absolute differences
            const delta = Math.abs(x - lx) + Math.abs(y - ly) + Math.abs(z - lz)
            const speed = delta / diff * 10000

            if (speed > 300) { 
                setShakeCount(prev => prev + 1)
                socketRef.current?.emit('shake', { 
                    gameId, 
                    playerId: player.playerId, 
                    intensity: Math.min(speed / 50, 5) 
                })
                
                if (navigator.vibrate) navigator.vibrate(50)
            }

            lastAcc.current = { x, y, z }
        }
    }

    window.addEventListener('devicemotion', handleMotion)

    return () => {
        window.removeEventListener('devicemotion', handleMotion)
    }
  }, [status, canShake, gameId, player])

  const manualShake = () => {
      if (status !== 'racing' || !canShake) return
      setShakeCount(prev => prev + 1)
      socketRef.current?.emit('shake', { 
        gameId, 
        playerId: player?.playerId, 
        intensity: 2 
      })
      if (navigator.vibrate) navigator.vibrate(50)
  }

  // Palace decoration for mobile bottom
  const MobilePalaceDecor = () => (
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none z-0">
          {/* Simple CSS shapes for roof */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#8B0000]"></div>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[120%] h-16 bg-[#DAA520] rounded-[100%] scale-x-150 origin-bottom"></div>
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[110%] h-2 bg-[#B8860B] rounded-[100%] scale-x-150 origin-bottom"></div>
      </div>
  )

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between transition-colors duration-500 overflow-hidden relative ${status === 'racing' ? 'bg-gradient-to-b from-red-500 to-orange-600' : 'bg-gradient-to-b from-green-700 to-green-900'} text-white`}>
        
        {/* Connection Status Banner */}
        {!isConnected && (
            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center text-xs py-1 z-50 animate-pulse">
                连接已断开，正在尝试重连...
            </div>
        )}

        {/* Top Header */}
        <div className="w-full p-6 z-10">
            {status === 'waiting' && (
                <div className="text-center animate-pulse mt-12">
                    <Smartphone size={80} className="mx-auto mb-6 text-yellow-400" />
                    <h2 className="text-3xl font-bold mb-4">等待比赛开始...</h2>
                    <p className="text-green-200">请留意大屏幕</p>
                    <button 
                        onClick={requestPermission}
                        className="mt-8 px-6 py-3 bg-white/20 rounded-full text-sm font-bold border border-white/40 active:scale-95 transition-transform"
                    >
                        如果是iPhone请点此授权
                    </button>
                </div>
            )}
            
            {status === 'racing' && (
                <div className="w-full flex justify-between items-center">
                    <div className="text-2xl font-bold">加速: {shakeCount}</div>
                    {!canShake && <div className="text-4xl font-bold text-yellow-300 animate-ping">{localCountdown}</div>}
                </div>
            )}
        </div>

        {/* Middle Content - 3D Horse for Racing */}
        {status === 'racing' && (
             <div className="flex-1 w-full relative z-10 flex flex-col items-center justify-center">
                <div className="h-64 w-full">
                    <Canvas shadows camera={{ position: [3, 2, 5], fov: 45 }}>
                        <Suspense fallback={null}>
                            <ambientLight intensity={1} />
                            <pointLight position={[5, 5, 5]} intensity={1.5} />
                            <Horse3D 
                                color={player?.color || 'brown'} 
                                nickname={player?.nickname} 
                                speed={canShake ? Math.min(shakeCount / 10, 5) : 0} 
                                rotation={[0, Math.PI / 4, 0]}
                                scale={1.2}
                                isStatic={true}
                            />
                            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
                        </Suspense>
                    </Canvas>
                    <Loader />
                </div>
                
                {canShake ? (
                    <div className="text-center mt-4">
                        <p className="text-2xl font-bold animate-bounce mb-4 text-yellow-300">疯狂摇动手机！</p>
                        <button 
                            onClick={manualShake}
                            className="w-48 h-48 rounded-full bg-yellow-400/80 backdrop-blur-sm border-4 border-yellow-200 shadow-xl active:scale-95 active:bg-yellow-500 transition-all flex items-center justify-center mx-auto"
                        >
                            <span className="text-red-900 font-bold text-2xl">点我<br/>加速</span>
                        </button>
                    </div>
                ) : (
                    <p className="text-3xl font-bold text-white mt-8">准备...</p>
                )}
             </div>
        )}

        {status === 'finished' && (
            <div className="flex-1 flex flex-col items-center justify-center z-10">
                <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
                <h2 className="text-3xl font-bold mb-4">比赛结束</h2>
                <p className="text-xl">请看大屏幕查看排名</p>
                <button 
                    onClick={() => navigate('/')}
                    className="mt-12 text-white/60 underline"
                >
                    返回首页
                </button>
            </div>
        )}

        {/* Bottom Decoration */}
        <MobilePalaceDecor />
    </div>
  )
}
