import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { MoveListPanel } from "@/components/MoveListPanel";
import { NavigationControls } from "@/components/NavigationControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChessGame } from "@/hooks/useChessGame";
import { useAutoPlay } from "@/hooks/useAutoPlay";
import { toast } from "sonner";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import type { Square } from "chess.js";
import type { Game } from "@/types/chess";

// This would normally come from your API/state management
// For now, we'll generate it based on the game ID
const generateGameData = (gameId: string): Game | null => {
  const firstNames = ["Magnus", "Fabiano", "Hikaru", "Wesley", "Levon", "Maxime", "Anish", "Ian", "Viswanathan", "Alexander", "Sergey", "Vladimir", "Boris", "Dmitry"];
  const lastNames = ["Carlsen", "Caruana", "Nakamura", "So", "Aronian", "Vachier-Lagrave", "Giri", "Nepomniachtchi", "Anand", "Grischuk", "Karjakin", "Kramnik", "Gelfand", "Andreikin"];
  
  const [, roundNum, gameIndex] = gameId.split("-");
  const whiteIndex = parseInt(gameIndex || "0") * 2;
  const blackIndex = whiteIndex + 1;
  
  // Generate a sample PGN with some realistic moves
  const samplePGNs = [
    `[Event "Spring Championship 2024"]
[Site "New York Chess Club"]
[Date "2024.03.15"]
[Round "${roundNum}"]
[White "${firstNames[whiteIndex % firstNames.length]} ${lastNames[whiteIndex % lastNames.length]}"]
[Black "${firstNames[blackIndex % firstNames.length]} ${lastNames[blackIndex % lastNames.length]}"]
[Result "1-0"]
[WhiteElo "2385"]
[BlackElo "2341"]
[TimeControl "90+30"]
[Opening "Sicilian Defense"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 
8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 b4 13. Ne2 Ne8 
14. f4 a5 15. f5 Bc4 16. Nbd4 exd4 17. Nxd4 a4 18. Kb1 Qa5 19. Qf2 Rc8 
20. Bd3 Bxd3 21. Rxd3 Nc5 22. Rh3 g6 23. fxg6 fxg6 24. Nf5 gxf5 
25. exf5+ Kh8 26. g6 Rf6 27. gxh7 Kxh7 28. Qh4+ Kg7 29. Rg1+ Kf7 
30. Qh7+ Ke6 31. Qxe7+ Kxe7 32. Rxc5 1-0`,
    
    `[Event "Spring Championship 2024"]
[Site "New York Chess Club"]
[Date "2024.03.15"]
[Round "${roundNum}"]
[White "${firstNames[whiteIndex % firstNames.length]} ${lastNames[whiteIndex % lastNames.length]}"]
[Black "${firstNames[blackIndex % firstNames.length]} ${lastNames[blackIndex % lastNames.length]}"]
[Result "1/2-1/2"]
[WhiteElo "2412"]
[BlackElo "2398"]
[TimeControl "90+30"]
[Opening "Queen's Gambit Declined"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4 
8. Bxe7 Qxe7 9. Rc1 c6 10. Bd3 Nxc3 11. Rxc3 dxc4 12. Bxc4 Nd7 13. O-O b6 
14. Bb3 c5 15. Qc2 Bb7 16. Rfc1 Rac8 17. dxc5 Nxc5 18. Nd4 Nxb3 
19. Qxb3 Rxc3 20. Rxc3 Rc8 21. Rxc8+ Bxc8 22. h3 Bd7 23. Qc2 Qc5 
24. Qd3 Qe5 25. Nf3 Qc5 26. Qd4 Qxd4 27. Nxd4 Kf8 28. Kf1 Ke7 
29. Ke2 f6 30. f4 Kd6 31. Kd3 e5 32. fxe5+ fxe5 33. Nf3 e4+ 34. Ke2 exf3+ 
35. Kxf3 Ke5 36. g4 Be6 37. Kg3 Bd5 38. Kf3 Be6 1/2-1/2`,
    
    `[Event "Spring Championship 2024"]
[Site "New York Chess Club"]
[Date "2024.03.15"]
[Round "${roundNum}"]
[White "${firstNames[whiteIndex % firstNames.length]} ${lastNames[whiteIndex % lastNames.length]}"]
[Black "${firstNames[blackIndex % firstNames.length]} ${lastNames[blackIndex % lastNames.length]}"]
[Result "0-1"]
[WhiteElo "2267"]
[BlackElo "2456"]
[TimeControl "90+30"]
[Opening "Ruy Lopez"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 
8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 
14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7 17. Rc1 Qb7 18. d5 Na5 19. b3 axb3 
20. axb3 Rfc8 21. Bd3 Qb6 22. Qe2 Rxc1 23. Rxc1 Rc8 24. Rxc8+ Bxc8 
25. Qc2 Bd7 26. Nf1 Qa6 27. Ng3 Qb6 28. Nh2 Nc6 29. Nhf1 Na5 30. Qb2 Nxb3 
31. Bxb5 Bxb5 32. Qxb3 Qxb3 33. Nxb3 Bd7 34. Nfd2 Kf8 35. f3 Ke8 
36. Kf2 Kd8 37. Nc4 Kc7 38. Na5 Kb6 39. Nc4+ Kc7 40. Na5 Kb6 
41. Nc4+ Kc7 42. Nba5 Nh5 43. Kg1 Nf4 44. Bxf4 exf4 45. Kf2 g5 
46. Nb3 h5 47. Na5 Kb6 48. Nc4+ Kc7 49. Na5 Kb6 50. Nc4+ Kc7 0-1`
  ];
  
  const pgnIndex = parseInt(gameIndex || "0") % samplePGNs.length;
  
  return {
    id: gameId,
    roundNumber: parseInt(roundNum || "1"),
    whitePlayer: {
      id: `player-${whiteIndex}`,
      name: `${firstNames[whiteIndex % firstNames.length]} ${lastNames[whiteIndex % lastNames.length]}`,
      rating: 2200 + Math.floor(Math.random() * 400),
      tournaments: [],
    },
    blackPlayer: {
      id: `player-${blackIndex}`,
      name: `${firstNames[blackIndex % firstNames.length]} ${lastNames[blackIndex % lastNames.length]}`,
      rating: 2200 + Math.floor(Math.random() * 400),
      tournaments: [],
    },
    result: ["1-0", "1/2-1/2", "0-1"][pgnIndex],
    pgn: samplePGNs[pgnIndex],
    date: "2024-03-15",
    opening: ["Sicilian Defense", "Queen's Gambit Declined", "Ruy Lopez"][pgnIndex],
    moves: 32,
  };
};

const GameViewer = () => {
  const { gameId, tournamentId } = useParams<{ gameId: string; tournamentId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);

  const {
    gameState,
    makeMove,
    loadPgn,
    goToMove,
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    isInAnalysisMode,
    returnToMainGame,
  } = useChessGame();

  const canGoNext = gameState.currentMoveIndex < gameState.moveHistory.length * 2 - 1;
  
  const { isAutoPlaying, toggleAutoPlay } = useAutoPlay(
    goToNext,
    canGoNext
  );

  useEffect(() => {
    if (gameId) {
      const gameData = generateGameData(gameId);
      if (gameData) {
        setGame(gameData);
        
        // Create metadata from game data
        const metadata = {
          event: "Spring Championship 2024",
          site: "New York Chess Club",
          date: gameData.date,
          round: gameData.roundNumber.toString(),
          white: {
            name: gameData.whitePlayer.name,
            rating: gameData.whitePlayer.rating?.toString(),
          },
          black: {
            name: gameData.blackPlayer.name,
            rating: gameData.blackPlayer.rating?.toString(),
          },
          result: gameData.result,
          timeControl: "90+30",
        };
        
        // Load the PGN
        const success = loadPgn(gameData.pgn, metadata);
        if (!success) {
          toast.error("Failed to load game");
        }
      } else {
        toast.error("Game not found");
        navigate("/tournaments");
      }
    }
  }, [gameId, loadPgn, navigate]);

  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    const success = makeMove(sourceSquare, targetSquare);
    if (!success) {
      toast.error("Illegal move");
    }
    return success;
  };

  const handleMoveClick = (moveIndex: number) => {
    goToMove(moveIndex);
  };

  const getResultBadge = (result: string) => {
    if (result === "1-0") return { text: "1-0", class: "bg-green-500 text-white font-bold" };
    if (result === "0-1") return { text: "0-1", class: "bg-red-500 text-white font-bold" };
    return { text: "½-½", class: "bg-gray-500 text-white font-bold" };
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const resultBadge = getResultBadge(game.result);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Game Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to={tournamentId ? `/tournament/${tournamentId}` : "/tournaments"}>
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournament
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">Round {game.roundNumber}</h1>
                <Badge className={`${resultBadge.class} rounded-full px-3 py-1`}>
                  {resultBadge.text}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {game.opening} • {game.date}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-8 bg-white dark:bg-gray-200 rounded border flex items-center justify-center text-xs font-medium text-black">
                    White
                  </div>
                  <span className="font-semibold text-foreground">{game.whitePlayer.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {game.whitePlayer.rating}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-8 bg-gray-800 rounded border flex items-center justify-center text-xs font-medium text-white">
                    Black
                  </div>
                  <span className="font-semibold text-foreground">{game.blackPlayer.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {game.blackPlayer.rating}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg">
                <Download className="h-4 w-4 mr-2" />
                Download PGN
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ChessBoardPanel
              position={gameState.fen}
              onPieceDrop={handlePieceDrop}
              isAnalysisMode={isInAnalysisMode}
              checkSquare={gameState.checkSquare}
              lastMove={gameState.lastMove}
              metadata={gameState.metadata}
              currentMoveIndex={gameState.currentMoveIndex}
            />
            
            <NavigationControls
              onFirst={goToFirst}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onLast={goToLast}
              onToggleAutoPlay={toggleAutoPlay}
              onReturnToMainGame={returnToMainGame}
              isAutoPlaying={isAutoPlaying}
              isAnalysisMode={isInAnalysisMode}
              disabled={gameState.moveHistory.length === 0}
            />
          </div>

          <div className="lg:col-span-1">
            <MoveListPanel
              moves={gameState.moveHistory}
              currentMoveIndex={gameState.currentMoveIndex}
              onMoveClick={handleMoveClick}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameViewer;
