import type { GameState, ConnectomeData } from './types'

const BASE = ''

export async function fetchState(): Promise<GameState> {
  const res = await fetch(`${BASE}/api/state`)
  if (!res.ok) throw new Error('Failed to fetch state')
  return res.json()
}

export async function fetchConnectome(): Promise<ConnectomeData> {
  const res = await fetch(`${BASE}/api/connectome`)
  if (!res.ok) throw new Error('Failed to fetch connectome')
  return res.json()
}

export async function makePlayerMove(move: string, mode: string): Promise<GameState> {
  const res = await fetch(`${BASE}/api/player-move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ move, mode }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid move' }))
    throw new Error(err.detail || 'Invalid move')
  }
  return res.json()
}

export async function makeFlyMove(mode: string): Promise<GameState> {
  const res = await fetch(`${BASE}/api/fly-move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ move: '', mode }),
  })
  if (!res.ok) throw new Error('Fly move failed')
  return res.json()
}

export async function resetGame(playerColor: string, mode: string): Promise<GameState> {
  const res = await fetch(`${BASE}/api/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_color: playerColor, mode }),
  })
  if (!res.ok) throw new Error('Reset failed')
  return res.json()
}
