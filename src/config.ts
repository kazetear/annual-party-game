
const isDev = import.meta.env.DEV

export const API_BASE = import.meta.env.VITE_API_URL || (isDev ? '/api' : window.location.origin + '/api')
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev ? window.location.hostname + ':3001' : window.location.origin)

console.log('Config loaded:', { isDev, API_BASE, SOCKET_URL, VITE_API_URL: import.meta.env.VITE_API_URL, VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL })
