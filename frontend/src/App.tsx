import { useState } from 'react'
import Layout from './components/Layout'
import PlayerCard from './components/PlayerCard'
import BrandBadge from './components/BrandBadge'
import GameControls from './components/GameControls'
import BrainCanvas from './components/BrainCanvas'
import ChessViewport from './components/ChessViewport'
import RightPanel from './components/RightPanel'
import ActionButtons from './components/ActionButtons'
import { useChessGame } from './hooks/useChessGame'

const MODE_CONFIG: Record<string, { label: string; level: number; flyRating: number; humanRating: number }> = {
  undefeatable: { label: 'UNDEFEATABLE', level: 10, flyRating: 3500, humanRating: 1500 },
  grandmaster_2300: { label: 'GRANDMASTER', level: 8, flyRating: 2300, humanRating: 1500 },
  tactical: { label: 'TACTICAL', level: 5, flyRating: 1600, humanRating: 1500 },
  policy: { label: 'CONNECTOME', level: 3, flyRating: 700, humanRating: 1500 },
}

export default function App() {
  const {
    gameState, selectedSquare, legalMoves, mode, setMode,
    isThinking, flyStats, lastMove, checkSquare, resultText,
    activeFlyMove, handleFlyPiecePlaced, handleSquareClick, resetGame,
    evalHistory, elapsedSeconds, moveCount,
  } = useChessGame()

  const [playerSide, setPlayerSide] = useState<'white' | 'black'>('white')

  const fen = gameState?.fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const isFlyTurn = gameState ? gameState.turn !== gameState.player_color : false
  const cfg = MODE_CONFIG[mode] ?? { label: 'AI', level: 8, flyRating: 2000, humanRating: 1500 }
  const isGameOver = gameState?.is_game_over ?? false

  /* Dynamic fly rating: shifts slightly based on eval advantage */
  const evalShift = flyStats ? Math.round(flyStats.eval_value * 15) : 0
  const flyRating = cfg.flyRating + evalShift

  /* Dynamic human rating: shifts based on material balance */
  const matShift = gameState ? Math.round(gameState.material_balance * 8) : 0
  const humanRating = cfg.humanRating + matShift

  function handleFlipBoard() {
    const newSide = playerSide === 'white' ? 'black' : 'white'
    setPlayerSide(newSide)
    resetGame(newSide)
  }

  function handleResign() {
    if (!isGameOver && !isThinking) {
      resetGame(playerSide)
    }
  }

  /* Position complexity: 0-1, derived from eval closeness to 0 + legal move count */
  const posComplexity = (() => {
    if (!gameState) return 0.3
    /* Close eval = harder decision for the fly */
    const evalCloseness = flyStats
      ? 1.0 - Math.min(1, Math.abs(flyStats.eval_value) / 3.0)
      : 0.5
    /* More legal moves = more complex position */
    const moveFactor = Math.min(1, (gameState.legal_moves?.length ?? 20) / 40)
    /* Check situations are always intense */
    const checkBonus = gameState.is_check ? 0.25 : 0
    return Math.min(1, evalCloseness * 0.5 + moveFactor * 0.3 + checkBonus + 0.15)
  })()

  const isMovingPiece = activeFlyMove !== null

  return (
    <Layout
      canvas={
        <ChessViewport
          fen={fen}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={lastMove}
          isThinking={isThinking}
          isCheck={gameState?.is_check ?? false}
          checkSquare={checkSquare}
          activeFlyMove={activeFlyMove}
          onPiecePlaced={handleFlyPiecePlaced}
          onSquareClick={handleSquareClick}
        />
      }
      topLeft={
        <>
          <PlayerCard
            name="D. MELANOGASTER"
            subtitle={`Connectome ${cfg.label}`}
            rating={flyRating}
            avatar="🪰"
            isActive={isFlyTurn}
            isThinking={isThinking}
            fen={fen}
            capturedSide="white"
          />
          <div className="hud-panel p-2 w-[280px]">
            <div className="hud-title mb-1">Neural Connectome</div>
            <BrainCanvas
              flyStats={flyStats}
              isActive={isThinking}
              isMoving={isMovingPiece}
              complexity={posComplexity}
            />
          </div>
        </>
      }
      topRight={
        <>
          <BrandBadge elapsedSeconds={elapsedSeconds} moveCount={moveCount} />
          <GameControls
            mode={mode}
            setMode={setMode}
            isThinking={isThinking}
            onReset={() => resetGame(playerSide)}
          />
        </>
      }
      rightPanels={
        <RightPanel
          flyStats={flyStats}
          isThinking={isThinking}
          evalHistory={evalHistory}
          moves={gameState?.move_history ?? []}
          turn={gameState?.turn ?? 'white'}
          moveCount={moveCount}
        />
      }
      bottomLeft={
        <PlayerCard
          name="YOU"
          subtitle={`vs ${cfg.label} (Lv ${cfg.level})`}
          rating={humanRating}
          avatar="👤"
          isActive={!isFlyTurn}
          fen={fen}
          capturedSide="black"
        />
      }
      bottomRight={
        <ActionButtons
          onFlipBoard={handleFlipBoard}
          onResign={handleResign}
          isThinking={isThinking}
          isGameOver={isGameOver}
        />
      }
      centerTop={
        isThinking ? (
          <div className="hud-panel px-4 py-2 flex items-center gap-2.5 text-xs text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <span className="text-base animate-pulse">🪰</span>
            <span className="font-semibold tracking-wide">Drosophila is calculating move</span>
            <span className="flex gap-1">
              <span className="thinking-dot text-sm">•</span>
              <span className="thinking-dot text-sm">•</span>
              <span className="thinking-dot text-sm">•</span>
            </span>
          </div>
        ) : isGameOver ? (
          <div className="hud-panel px-5 py-3 text-center">
            <div className="text-sm font-bold text-cyan-400">{resultText}</div>
          </div>
        ) : undefined
      }
    />
  )
}
