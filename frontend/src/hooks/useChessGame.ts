import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import type { GameState, FlyStats, DifficultyMode, PieceSymbol } from '../types'
import * as api from '../api'

export interface ActiveFlyMove {
  from: string
  to: string
  pieceType: PieceSymbol
  color: 'w' | 'b'
  nextState: GameState
}

export function useChessGame() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const chessRef = useRef(new Chess())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoves, setLegalMoves] = useState<string[]>([])
  const [mode, setMode] = useState<DifficultyMode>('undefeatable')
  const [isThinking, setIsThinking] = useState(false)
  const [flyStats, setFlyStats] = useState<FlyStats | null>(null)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [activeFlyMove, setActiveFlyMove] = useState<ActiveFlyMove | null>(null)
  const [evalHistory, setEvalHistory] = useState<number[]>([0])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── Initialize ── */
  useEffect(() => {
    api.fetchState().then((state) => {
      setGameState(state)
      chessRef.current.load(state.fen)
    }).catch(console.error)
  }, [])

  /* ── Game timer ── */
  useEffect(() => {
    if (gameState && !gameState.is_game_over) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState?.is_game_over])

  /* ── Compute check square ── */
  const checkSquare = (() => {
    if (!gameState?.is_check) return null
    const chess = chessRef.current
    // Find king of the side to move
    const board = chess.board()
    const color = gameState.turn === 'white' ? 'w' : 'b'
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f]
        if (piece && piece.type === 'k' && piece.color === color) {
          return String.fromCharCode(97 + f) + (8 - r)
        }
      }
    }
    return null
  })()

  /* ── Handle square click ── */
  const handleSquareClick = useCallback(async (square: string) => {
    if (!gameState || gameState.is_game_over || isThinking) return
    if (gameState.turn !== gameState.player_color) return

    const chess = chessRef.current
    const playerColor = gameState.player_color === 'white' ? 'w' : 'b'
    const piece = chess.get(square as any)

    if (selectedSquare) {
      /* ── Attempt move ── */
      const moveUci = selectedSquare + square
      const isLegal = legalMoves.some((m) => m.startsWith(moveUci))

      if (isLegal) {
        try {
          const state = await api.makePlayerMove(moveUci, mode)
          setGameState(state)
          chess.load(state.fen)
          setLastMove({ from: selectedSquare, to: square })
          setSelectedSquare(null)
          setLegalMoves([])

          /* Trigger fly move */
          if (!state.is_game_over) {
            setIsThinking(true)
            try {
              const flyState = await api.makeFlyMove(mode)
              if (flyState.fly_stats) {
                const fm = flyState.fly_stats.chosen_move
                const fromSq = fm.slice(0, 2)
                const toSq = fm.slice(2, 4)
                const p = chess.get(fromSq as any)

                /* Set flyStats immediately so the brain lights up during animation */
                setFlyStats(flyState.fly_stats)

                // Trigger physical hand-movement animation
                // NOTE: isThinking stays true — handleFlyPiecePlaced will clear it
                setActiveFlyMove({
                  from: fromSq,
                  to: toSq,
                  pieceType: (p ? p.type : 'p') as PieceSymbol,
                  color: 'b',
                  nextState: flyState,
                })
              } else {
                setGameState(flyState)
                chess.load(flyState.fen)
                setIsThinking(false)
              }
            } catch (err) {
              console.error('Fly move error:', err)
              setIsThinking(false)
            }
            /* isThinking is NOT cleared here — it stays true until the
               fly animation completes via handleFlyPiecePlaced */
          }
        } catch {
          /* Move rejected — try re-selecting */
          selectPiece(square, piece, playerColor, chess)
        }
      } else {
        /* Not a legal target — try selecting new piece */
        selectPiece(square, piece, playerColor, chess)
      }
    } else {
      /* ── Select piece ── */
      selectPiece(square, piece, playerColor, chess)
    }
  }, [gameState, selectedSquare, legalMoves, mode, isThinking])

  function selectPiece(
    square: string,
    piece: ReturnType<Chess['get']>,
    playerColor: string,
    chess: Chess,
  ) {
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square)
      const moves = chess.moves({ square: square as any, verbose: true })
      setLegalMoves(moves.map((m) => m.from + m.to))
    } else {
      setSelectedSquare(null)
      setLegalMoves([])
    }
  }

  /* ── Reset ── */
  const resetGame = useCallback(async (playerColor: string = 'white') => {
    try {
      const state = await api.resetGame(playerColor, mode)
      setGameState(state)
      chessRef.current.load(state.fen)
      setSelectedSquare(null)
      setLegalMoves([])
      setFlyStats(null)
      setLastMove(null)
      setIsThinking(false)
      setEvalHistory([0])
      setElapsedSeconds(0)
    } catch (err) {
      console.error('Reset error:', err)
    }
  }, [mode])

  /* ── Game result text ── */
  const resultText = (() => {
    if (!gameState?.is_game_over) return undefined
    if (gameState.is_checkmate) {
      return gameState.turn === gameState.player_color ? '🪰 Drosophila wins by checkmate!' : '🎉 You win!'
    }
    if (gameState.is_stalemate) return 'Draw — Stalemate'
    if (gameState.is_draw) return 'Draw'
    return 'Game Over'
  })()

  /* ── Fly piece placed on target square ── */
  const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFlyPiecePlaced = useCallback(() => {
    if (!activeFlyMove) return
    const nextState = activeFlyMove.nextState
    setGameState(nextState)
    chessRef.current.load(nextState.fen)
    if (nextState.fly_stats) {
      setFlyStats(nextState.fly_stats)
      setEvalHistory((prev) => [...prev, nextState.fly_stats!.eval_value])
      const fm = nextState.fly_stats.chosen_move
      setLastMove({ from: fm.slice(0, 2), to: fm.slice(2, 4) })
    }
    setActiveFlyMove(null)
    /* Stop "thinking" immediately so BrainCanvas begins decay animation */
    setIsThinking(false)

    /* Clear flyStats after 2s so the brain fully dims to idle */
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current)
    decayTimerRef.current = setTimeout(() => {
      setFlyStats(null)
      decayTimerRef.current = null
    }, 2000)
  }, [activeFlyMove])

  return {
    gameState,
    selectedSquare,
    legalMoves,
    mode,
    setMode,
    isThinking,
    flyStats,
    lastMove,
    checkSquare,
    resultText,
    activeFlyMove,
    handleFlyPiecePlaced,
    handleSquareClick,
    resetGame,
    evalHistory,
    elapsedSeconds,
    moveCount: gameState?.move_history?.length ?? 0,
  }
}
