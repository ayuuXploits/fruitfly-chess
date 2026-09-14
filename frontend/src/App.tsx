import Layout from './components/Layout'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import ChessViewport from './components/ChessViewport'
import RightPanel from './components/RightPanel'
import { useChessGame } from './hooks/useChessGame'

export default function App() {
  const {
    gameState, selectedSquare, legalMoves, mode, setMode,
    isThinking, flyStats, lastMove, checkSquare, resultText,
    activeFlyMove, handleFlyPiecePlaced, handleSquareClick, resetGame,
  } = useChessGame()

  const fen = gameState?.fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

  return (
    <Layout
      header={
        <Header
          mode={mode}
          setMode={setMode}
          isThinking={isThinking}
          turn={gameState?.turn ?? 'white'}
          onReset={() => resetGame('white')}
          isGameOver={gameState?.is_game_over ?? false}
          result={resultText}
        />
      }
      left={
        <LeftPanel
          gameState={gameState}
          flyStats={flyStats}
          isThinking={isThinking}
        />
      }
      center={
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
      right={
        <RightPanel
          flyStats={flyStats}
          isThinking={isThinking}
        />
      }
    />
  )
}
