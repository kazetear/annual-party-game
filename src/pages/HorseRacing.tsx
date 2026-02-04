import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Sky, Loader } from '@react-three/drei'
import { io, Socket } from 'socket.io-client'
import * as THREE from 'three'
import { QRCodeSVG } from 'qrcode.react'
import { Horse3D } from '@/components/Horse3D'

import { API_BASE as BASE_URL, SOCKET_URL } from '@/config'

const API_BASE = BASE_URL + '/horse-racing'

interface Player {
  id: string
  nickname: string
  playerNumber: number
  progress: number // 0 to 100
  speed: number
  color: string
}

const TRACK_LENGTH = 100

function HorseWrapper({ player, position }: { player: Player, position: number }) {
  const meshRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (meshRef.current) {
      // Smooth interpolation for movement
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, player.progress - TRACK_LENGTH/2, 0.1)
    }
  })

  return (
    <group ref={meshRef} position={[ -TRACK_LENGTH/2, 0, position ]}>
       <Horse3D 
          color={player.color} 
          nickname={player.nickname} 
          speed={player.speed} 
          rotation={[0, 0, 0]} // Face Positive X (Default for new model)
       />
    </group>
  )
}

function PalaceBackground() {
    return (
        <group position={[0, 0, -25]}>
            {/* Main Palace Wall */}
            <mesh position={[0, 5, 0]} receiveShadow>
                <boxGeometry args={[TRACK_LENGTH + 60, 10, 2]} />
                <meshStandardMaterial color="#8B0000" /> {/* Dark Red Wall */}
            </mesh>
            
            {/* Columns */}
            {Array.from({ length: 15 }).map((_, i) => (
                <mesh key={i} position={[(i * 10) - 70, 5, 1.5]} castShadow>
                    <cylinderGeometry args={[0.6, 0.8, 10]} />
                    <meshStandardMaterial color="#8B0000" />
                </mesh>
            ))}

            {/* Roof - Simplified with multiple segments */}
            {Array.from({ length: 5 }).map((_, i) => (
                <group key={i} position={[(i * 30) - 60, 12, 0]}>
                    {/* Roof Top */}
                    <mesh rotation={[0, 0, 0]}>
                        <coneGeometry args={[20, 8, 4]} rotation={[0, Math.PI/4, 0]} />
                        <meshStandardMaterial color="#DAA520" /> {/* Gold Roof */}
                    </mesh>
                    {/* Eaves */}
                    <mesh position={[0, -2, 0]}>
                        <boxGeometry args={[28, 1, 6]} />
                        <meshStandardMaterial color="#DAA520" />
                    </mesh>
                </group>
            ))}

            {/* Trees/Plants in front of wall */}
            {Array.from({ length: 20 }).map((_, i) => (
                <group key={`tree-${i}`} position={[(i * 8) - 75, 0, 4]}>
                    <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.2, 0.4, 3]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[0, 3.5, 0]}>
                        <sphereGeometry args={[1.5, 8, 8]} />
                        <meshStandardMaterial color="#2E8B57" />
                    </mesh>
                    {/* Cherry Blossoms */}
                    <mesh position={[0.5, 4, 0.5]}>
                        <sphereGeometry args={[0.8, 8, 8]} />
                        <meshStandardMaterial color="#FF69B4" />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

function CameraController({ players, status }: { players: Player[], status: string }) {
    const { camera } = useThree()
    const targetRef = useRef(new THREE.Vector3(0, 0, 0))
    const cameraOffset = useRef(new THREE.Vector3(15, 8, 15)) // Side-ish view

    useFrame(() => {
        if (status === 'racing' && players.length > 0) {
            // Find the leader
            const leader = players.reduce((prev, current) => (prev.progress > current.progress) ? prev : current)
            
            // Calculate target position (leader's position)
            const targetX = leader.progress - TRACK_LENGTH/2
            
            // Smoothly interpolate camera target focus
            targetRef.current.x = THREE.MathUtils.lerp(targetRef.current.x, targetX + 5, 0.05) // Look slightly ahead
            
            // Smoothly move camera
            // Camera stays at a fixed offset relative to the target X
            const desiredCameraX = targetX + 10 // Camera follows behind/side
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredCameraX, 0.05)
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 10, 0.05) // Height
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 20, 0.05) // Distance
            
            camera.lookAt(targetRef.current)
        } else if (status === 'waiting' || status === 'countdown') {
            // Focus on Start Line
            const startX = -TRACK_LENGTH/2
            const targetPos = new THREE.Vector3(startX + 15, 8, 15) // Angle from front-side
            const targetLook = new THREE.Vector3(startX, 0, 0) // Look at start line

            camera.position.lerp(targetPos, 0.05)
            
            // Smooth lookAt using a dummy target
            targetRef.current.lerp(targetLook, 0.05)
            camera.lookAt(targetRef.current)
        }
    })

    return null
}

function RaceTrack({ players }: { players: Player[] }) {
    return (
        <group>
            {/* Ground - Sand/Dirt Track */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[TRACK_LENGTH + 100, 60]} /> {/* Extended ground */}
                <meshStandardMaterial color="#D2B48C" roughness={1} /> {/* Tan/Sand color */}
            </mesh>
            
            {/* Palace Background */}
            <PalaceBackground />

            {/* Lane Lines */}
            {Array.from({ length: 10 }).map((_, i) => (
                 <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, i * 3 - 15]} receiveShadow>
                    <planeGeometry args={[TRACK_LENGTH + 40, 0.1]} />
                    <meshStandardMaterial color="#FFF" opacity={0.5} transparent />
                </mesh>
            ))}
            
            {/* Start Line */}
            <mesh position={[-TRACK_LENGTH/2, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[2, 30]} />
                <meshStandardMaterial color="white" />
            </mesh>

            {/* Finish Line - Checkered Pattern */}
            <group position={[TRACK_LENGTH/2, 0.02, 0]}>
                {Array.from({ length: 4 }).map((_, row) => 
                    Array.from({ length: 40 }).map((_, col) => (
                        <mesh 
                            key={`${row}-${col}`} 
                            rotation={[-Math.PI/2, 0, 0]} 
                            position={[row - 1.5, 0, col - 20]}
                        >
                            <planeGeometry args={[1, 1]} />
                            <meshStandardMaterial color={(row + col) % 2 === 0 ? 'white' : 'black'} />
                        </mesh>
                    ))
                )}
                {/* Finish Line Text - Floating above */}
                <Html position={[0, 4, 0]} transform rotation={[0, -Math.PI/2, 0]}>
                    <div className="text-5xl font-bold text-yellow-400 drop-shadow-lg tracking-widest border-4 border-black px-4 bg-black/50">
                        FINISH
                    </div>
                </Html>
            </group>

            {/* Players */}
            {players.map((player, idx) => (
                <HorseWrapper key={player.id} player={player} position={idx * 2 - (players.length * 2) / 2} />
            ))}
        </group>
    )
}

export default function HorseRacing() {
  const [sessionId, setSessionId] = useState<string>('')
  const [status, setStatus] = useState<'waiting' | 'countdown' | 'racing' | 'finished'>('waiting')
  const [players, setPlayers] = useState<Player[]>([])
  const [countdown, setCountdown] = useState(3)
  const [raceTimeLeft, setRaceTimeLeft] = useState(60) // Increased race time
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  
  // Create Game Session
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/create`, { method: 'POST' })
        const data = await res.json()
        if (data.sessionId) {
          setSessionId(data.sessionId)
          
          // Connect Socket
          const socket = io(SOCKET_URL, {
              reconnection: true,
              reconnectionAttempts: Infinity,
              timeout: 5000
          })
          socketRef.current = socket
          
          socket.on('connect', () => {
              setIsConnected(true)
              socket.emit('join_game', { gameId: data.sessionId, nickname: 'SCREEN' })
          })

          socket.on('disconnect', () => {
              setIsConnected(false)
          })

          socket.on('connect_error', (err) => {
              console.error('Socket error:', err)
              setIsConnected(false)
          })
          
          socket.on('player_joined', (player: any) => {
            if (player.nickname === 'SCREEN') return
            setPlayers(prev => {
                if (prev.find(p => p.id === player.id)) return prev
                return [...prev, {
                    ...player,
                    progress: 0,
                    speed: 0,
                    color: `hsl(${Math.random() * 30 + 10}, 70%, 30%)` // Brown-ish/Darker colors for horses
                }]
            })
          })

          socket.on('game_start', () => {
            setStatus('countdown')
          })

          socket.on('player_moved', ({ playerId, intensity }: any) => {
             setPlayers(prev => prev.map(p => {
                 if (p.id === playerId) {
                     // Update speed/progress
                     return { ...p, speed: intensity, progress: Math.min(p.progress + intensity * 0.5, TRACK_LENGTH) }
                 }
                 return p
             }))
          })
        }
      } catch (err) {
        console.error('Failed to init game', err)
      }
    }
    createSession()

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  // Countdown Logic
  useEffect(() => {
    if (status === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setStatus('racing')
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status])

  // Race Timer Logic
  useEffect(() => {
    if (status === 'racing') {
      const timer = setInterval(() => {
        setRaceTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status])

  // Game Loop / Finish Check
  useEffect(() => {
    if (status === 'racing') {
        // Check if everyone finished or timeout
        const finishedPlayers = players.filter(p => p.progress >= TRACK_LENGTH)
        const isTimeUp = raceTimeLeft <= 0
        
        // End if all finished or time up (and at least one player exists)
        if ((players.length > 0 && finishedPlayers.length === players.length) || isTimeUp) {
            setStatus('finished')
            // Save results
            fetch(`${API_BASE}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    gameId: sessionId,
                    rankings: players
                        .sort((a, b) => b.progress - a.progress)
                        .map((p, idx) => ({ participantId: p.id, rank: idx + 1 }))
                })
            })
        }
    }
  }, [players, status, sessionId, raceTimeLeft])

  const startGame = async () => {
      await fetch(`${API_BASE}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: sessionId })
      })
  }

  const joinUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/join/${sessionId}`

  return (
    <div className="w-full h-screen relative bg-sky-300">
        {/* Connection Warning */}
        {!isConnected && (
            <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-2 font-bold animate-pulse text-2xl uppercase tracking-widest">
                ⚠️ 与服务器断开连接 - 正在重连...
            </div>
        )}

        {/* 3D Scene */}
        <Canvas shadows camera={{ position: [0, 8, 25], fov: 45 }}>
            <Suspense fallback={null}>
                <fog attach="fog" args={['#87CEEB', 20, 100]} />
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 20, 10]} intensity={1.5} castShadow color="#fff" />
                <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
                
                <CameraController players={players} status={status} />
                <RaceTrack players={players} />
                
                {/* Only allow manual control when not racing/following camera */}
                {status !== 'racing' && <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} />}
            </Suspense>
        </Canvas>
        <Loader />

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
            <header className="flex justify-between items-start">
                <div className="bg-black/50 p-4 rounded-xl text-white backdrop-blur-md">
                    <h1 className="text-4xl font-bold text-yellow-400">赛马竞技</h1>
                    <p>房间号: {sessionId.slice(0, 4)}...</p>
                    <p>已加入: {players.length} 人</p>
                </div>
                
                {status === 'waiting' && (
                    <div className="bg-white p-4 rounded-xl shadow-xl pointer-events-auto flex flex-col items-center">
                        <QRCodeSVG value={joinUrl} size={192} className="mb-2" />
                        <p className="text-black font-bold mb-2">扫码加入游戏</p>
                        {window.location.hostname === 'localhost' && (
                            <p className="text-red-500 text-xs mb-2 max-w-[200px] text-center">
                                注意：请使用本机局域网IP访问此页面，否则手机无法扫码。
                            </p>
                        )}
                        <button 
                            onClick={startGame}
                            className="bg-green-600 text-white px-8 py-2 rounded-full font-bold hover:bg-green-700 transition-colors"
                        >开始比赛
                        </button>
                    </div>
                )}
            </header>

            {status === 'countdown' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-[200px] font-bold text-yellow-400 animate-pulse">
                        {countdown}
                    </div>
                </div>
            )}

            {/* Race Timer */}
            {status === 'racing' && (
                <div className="absolute top-4 right-8 z-50">
                    <div className="bg-red-600 text-white px-8 py-4 rounded-xl font-mono text-4xl font-bold shadow-2xl border-4 border-yellow-400 animate-pulse flex items-center gap-2">
                        <span>⏱️</span>
                        <span>{raceTimeLeft}s</span>
                    </div>
                </div>
            )}

            {/* Leaderboard Overlay - Only during racing */}
            {status === 'racing' && (
                <div className="absolute top-20 right-8 bg-black/60 text-white p-4 rounded-xl backdrop-blur-md w-64 max-h-[80vh] overflow-y-auto z-40">
                    <h3 className="font-bold text-xl mb-4 border-b border-white/20 pb-2">实时排名</h3>
                    {players
                        .sort((a, b) => b.progress - a.progress)
                        .map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between mb-2">
                                <span className={`font-bold w-6 ${idx < 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                    {idx + 1}
                                </span>
                                <span className="truncate flex-1">{p.nickname}</span>
                                <span className="text-xs text-gray-300 ml-2">{Math.floor(p.progress)}m</span>
                            </div>
                        ))
                    }
                </div>
            )}

            {/* Final Results - Centered */}
            {status === 'finished' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-gradient-to-b from-red-900 to-red-950 p-12 rounded-3xl border-4 border-yellow-500 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-center">
                        <h2 className="text-5xl font-bold text-yellow-400 mb-8 flex items-center justify-center gap-4">
                            🏆 比赛结果 🏆
                        </h2>
                        
                        <div className="space-y-6">
                            {/* Top 3 */}
                            <div className="flex justify-center items-end gap-4 mb-12">
                                {players.length >= 2 && (
                                    <div className="flex flex-col items-center">
                                        <div className="text-gray-300 text-xl font-bold mb-2">{players.sort((a, b) => b.progress - a.progress)[1].nickname}</div>
                                        <div className="w-24 h-32 bg-gray-400 rounded-t-lg flex items-center justify-center text-4xl font-bold text-white border-t-4 border-gray-200">2</div>
                                    </div>
                                )}
                                {players.length >= 1 && (
                                    <div className="flex flex-col items-center">
                                        <div className="text-yellow-300 text-2xl font-bold mb-2">👑 {players.sort((a, b) => b.progress - a.progress)[0].nickname}</div>
                                        <div className="w-28 h-40 bg-yellow-500 rounded-t-lg flex items-center justify-center text-5xl font-bold text-white border-t-4 border-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.5)]">1</div>
                                    </div>
                                )}
                                {players.length >= 3 && (
                                    <div className="flex flex-col items-center">
                                        <div className="text-orange-300 text-xl font-bold mb-2">{players.sort((a, b) => b.progress - a.progress)[2].nickname}</div>
                                        <div className="w-24 h-24 bg-orange-600 rounded-t-lg flex items-center justify-center text-4xl font-bold text-white border-t-4 border-orange-400">3</div>
                                    </div>
                                )}
                            </div>

                            {/* Prize List */}
                            <div className="bg-black/30 rounded-xl p-6 text-left">
                                <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">获奖名单</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {players
                                        .sort((a, b) => b.progress - a.progress)
                                        .map((p, idx) => {
                                            let prize = ''
                                            let color = ''
                                            if (idx === 0) { prize = '一等奖'; color = 'text-yellow-400' }
                                            else if (idx === 1) { prize = '二等奖'; color = 'text-gray-300' }
                                            else if (idx === 2) { prize = '三等奖'; color = 'text-orange-400' }
                                            else if (idx < 20) { prize = '优秀奖'; color = 'text-blue-300' }
                                            else { prize = '参与奖'; color = 'text-white/50' }

                                            return (
                                                <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-mono font-bold w-8 ${idx < 3 ? 'text-white' : 'text-white/50'}`}>#{idx + 1}</span>
                                                        <span className="text-lg text-white">{p.nickname}</span>
                                                    </div>
                                                    <span className={`font-bold ${color}`}>{prize}</span>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>

                            <button 
                                onClick={async () => {
                                    window.location.reload()
                                }}
                                className="mt-8 bg-yellow-500 text-red-900 px-12 py-4 rounded-full text-2xl font-bold hover:bg-yellow-400 transition-transform hover:scale-105 active:scale-95 shadow-lg pointer-events-auto"
                            >
                                开启新一轮
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}
