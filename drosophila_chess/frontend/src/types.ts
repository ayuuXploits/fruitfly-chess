/* ─── Shared type definitions for the Drosophila Chess 3D UI ─── */

export interface GameState {
  fen: string
  turn: 'white' | 'black'
  is_game_over: boolean
  is_check: boolean
  is_checkmate: boolean
  is_stalemate: boolean
  is_draw: boolean
  legal_moves: string[]
  material_balance: number
  move_history: MoveEntry[]
  player_color: 'white' | 'black'
  fly_stats?: FlyStats
}

export interface MoveEntry {
  player: string
  uci: string
  san: string
}

export interface FlyStats {
  sensory_firing: number
  inter_firing: number
  motor_firing: number
  eval_value: number
  eval_cp: number
  search_depth: number
  nodes_searched: number
  search_time_ms: number
  engine_type: string
  chosen_move: string
  chosen_san: string
}

export interface ConnectomeData {
  nodes: ConnectomeNode[]
  edges: ConnectomeEdge[]
  total_nodes: number
  total_edges: number
}

export interface ConnectomeNode {
  id: number
  x: number
  y: number
  neuropil: string
  cell_type: string
  color: string
}

export interface ConnectomeEdge {
  source: number
  target: number
  weight: number
}

export type DifficultyMode = 'undefeatable' | 'grandmaster_2300' | 'tactical' | 'policy'

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
