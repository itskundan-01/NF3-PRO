import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Award,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react";
import { Player, TournamentParticipation, Game } from "@/types/chess";

// Mock data generator
const generateMockPlayer = (id: string): Player => {
  const firstNames = ["Magnus", "Fabiano", "Hikaru", "Wesley", "Levon", "Maxime", "Anish", "Ian", "Alexander"];
  const lastNames = ["Carlsen", "Caruana", "Nakamura", "So", "Aronian", "Vachier-Lagrave", "Giri", "Nepomniachtchi", "Grischuk"];
  const playerName = `${firstNames[parseInt(id) % firstNames.length]} ${lastNames[parseInt(id) % lastNames.length]}`;
  
  const tournaments: TournamentParticipation[] = [
    {
      tournamentId: "1",
      tournamentName: "Spring Championship 2024",
      date: "2024-03-15",
      score: "5.5/7",
      rank: 3,
      games: Array(7)
        .fill(null)
        .map((_, i) => {
          const opponentNames = ["Sergey Karjakin", "Vladimir Kramnik", "Boris Gelfand", "Dmitry Andreikin", "Peter Svidler", "Robert Fischer", "David Bronstein"];
          return {
            id: `game-${i}`,
            roundNumber: i + 1,
            whitePlayer: {
              id: Math.random() > 0.5 ? id : `opponent-${i}`,
              name: Math.random() > 0.5 ? playerName : opponentNames[i],
              rating: 2000 + Math.floor(Math.random() * 400),
              tournaments: [],
            },
            blackPlayer: {
              id: Math.random() > 0.5 ? `opponent-${i}` : id,
              name: Math.random() > 0.5 ? opponentNames[i] : playerName,
              rating: 2000 + Math.floor(Math.random() * 400),
              tournaments: [],
            },
            result: ["1-0", "0-1", "1/2-1/2"][Math.floor(Math.random() * 3)],
            pgn: "[Event \"Spring Championship\"]\n[Round \"" + (i + 1) + "\"]\n1. e4 e5",
            date: "2024-03-15",
            opening: ["Sicilian Defense", "French Defense", "Queen's Gambit"][
              Math.floor(Math.random() * 3)
            ],
            moves: 40 + Math.floor(Math.random() * 40),
          };
        }),
    },
    {
      tournamentId: "2",
      tournamentName: "City Open Tournament",
      date: "2024-04-05",
      score: "6/9",
      rank: 12,
      games: [],
    },
    {
      tournamentId: "3",
      tournamentName: "Regional Masters Cup",
      date: "2024-05-10",
      score: "4/5",
      rank: 7,
      games: [],
    },
  ];

  const totalGames = 21;
  const wins = 13;
  const draws = 5;
  const losses = 3;

  return {
    id,
    name: playerName,
    rating: 2345,
    title: "FM",
    country: "USA",
    bio: "FIDE Master with 15 years of competitive experience. Specializes in positional play and endgame technique. Passionate about coaching and promoting chess in local communities.",
    tournaments,
    stats: {
      totalGames,
      wins,
      losses,
      draws,
      winRate: Math.round((wins / totalGames) * 100),
      averageRating: 2300,
    },
  };
};

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const player = generateMockPlayer(id || "1");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getResultColor = (game: Game, playerId: string) => {
    if (game.whitePlayer.id === playerId) {
      if (game.result === "1-0") return "text-green-600 dark:text-green-400";
      if (game.result === "0-1") return "text-red-600 dark:text-red-400";
    } else {
      if (game.result === "0-1") return "text-green-600 dark:text-green-400";
      if (game.result === "1-0") return "text-red-600 dark:text-red-400";
    }
    return "text-gray-600 dark:text-gray-400";
  };

  const getResultText = (game: Game, playerId: string) => {
    if (game.result === "1/2-1/2") return "Draw";
    if (game.whitePlayer.id === playerId) {
      return game.result === "1-0" ? "Win" : "Loss";
    } else {
      return game.result === "0-1" ? "Win" : "Loss";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/tournaments">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex gap-6">
              <Avatar className="h-24 w-24 border-4 shadow-lg">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{player.name}</h1>
                  {player.title && (
                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 text-sm font-bold rounded-full">
                      {player.title}
                    </Badge>
                  )}
                  {player.country && (
                    <Badge variant="outline" className="rounded-full">
                      {player.country}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xl font-bold text-primary">
                      {player.rating}
                    </span>
                    <span className="text-sm text-muted-foreground">Rating</span>
                  </div>
                </div>

                {player.bio && (
                  <p className="text-muted-foreground max-w-2xl">{player.bio}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg">
                <Download className="h-4 w-4 mr-2" />
                Export Games
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-6 text-center bg-card rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-primary mb-1">
                {player.stats?.totalGames}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Total Games</div>
            </Card>

            <Card className="p-6 text-center bg-card rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {player.stats?.wins}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Wins</div>
            </Card>

            <Card className="p-6 text-center bg-card rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                {player.stats?.draws}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Draws</div>
            </Card>

            <Card className="p-6 text-center bg-card rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-primary mb-1">
                {player.stats?.winRate}%
              </div>
              <div className="text-sm text-muted-foreground font-medium">Win Rate</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="tournaments" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="tournaments" className="rounded-lg">
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="games" className="rounded-lg">
              Recent Games
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg">
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-4">
            {player.tournaments.map((tournament) => (
              <Link key={tournament.tournamentId} to={`/tournament/${tournament.tournamentId}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card rounded-2xl hover:-translate-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold mb-1 text-foreground">{tournament.tournamentName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(tournament.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{tournament.score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="text-2xl font-bold">#{tournament.rank}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Rank</div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-4">
            {player.tournaments[0]?.games.map((game, index) => {
              const isWhite = game.whitePlayer.id === player.id;
              const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
              const resultText = getResultText(game, player.id);
              const resultColor = getResultColor(game, player.id);

              return (
                <Card
                  key={game.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 bg-card rounded-2xl hover:-translate-y-0.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="rounded-full">
                          Round {game.roundNumber}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{game.opening}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-8 bg-white dark:bg-gray-200 rounded border flex items-center justify-center text-xs font-medium text-black">
                            White
                          </div>
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="text-xs bg-muted text-foreground">
                              {getInitials(game.whitePlayer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{game.whitePlayer.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({game.whitePlayer.rating})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-16 h-8 bg-gray-800 dark:bg-gray-700 rounded border flex items-center justify-center text-xs font-medium text-white">
                            Black
                          </div>
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="text-xs bg-gray-700 text-white">
                              {getInitials(game.blackPlayer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{game.blackPlayer.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({game.blackPlayer.rating})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Badge
                          className={`${resultColor} text-lg font-bold px-4 py-2 rounded-xl border-2`}
                          variant="outline"
                        >
                          {resultText}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {game.moves} moves
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" className="rounded-lg">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Performance Stats */}
              <Card className="p-6 bg-card rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Performance</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="text-2xl font-bold text-primary">
                      {player.stats?.winRate}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Wins</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {player.stats?.wins}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Draws</span>
                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {player.stats?.draws}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Losses</span>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {player.stats?.losses}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Tournament Stats */}
              <Card className="p-6 bg-card rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Tournament History</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tournaments Played</span>
                    <span className="text-2xl font-bold">{player.tournaments.length}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Best Ranking</span>
                    <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      #
                      {Math.min(...player.tournaments.map((t) => t.rank))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Rating</span>
                    <span className="text-2xl font-bold">{player.stats?.averageRating}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Rating</span>
                    <span className="text-2xl font-bold text-primary">{player.rating}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlayerProfile;
