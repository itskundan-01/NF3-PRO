import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Medal,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react";
import { Tournament, Round, Game, Player } from "@/types/chess";

// Mock data generator
const generateMockGame = (
  roundNum: number,
  whitePlayer: Player,
  blackPlayer: Player,
  gameIndex: number
): Game => {
  const results = ["1-0", "0-1", "1/2-1/2"];
  const openings = [
    "Sicilian Defense",
    "French Defense",
    "Caro-Kann Defense",
    "Queen's Gambit",
    "King's Indian Defense",
    "Ruy Lopez",
    "Italian Game",
    "English Opening",
  ];

  return {
    id: `game-${roundNum}-${gameIndex}`,
    roundNumber: roundNum,
    whitePlayer,
    blackPlayer,
    result: results[Math.floor(Math.random() * results.length)],
    pgn: "[Event \"Mock Game\"]\n[Site \"Tournament\"]\n[Date \"2024.03.15\"]\n[Round \"1\"]\n[White \"" + whitePlayer.name + "\"]\n[Black \"" + blackPlayer.name + "\"]\n[Result \"1-0\"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6",
    date: "2024-03-15",
    opening: openings[Math.floor(Math.random() * openings.length)],
    moves: 40 + Math.floor(Math.random() * 60),
    timeControl: "90+30",
  };
};

const generateMockTournament = (id: string): Tournament => {
  const firstNames = ["Magnus", "Fabiano", "Hikaru", "Wesley", "Levon", "Maxime", "Anish", "Ian", "Viswanathan", "Alexander", "Sergey", "Vladimir", "Boris", "Dmitry", "Peter", "Robert", "David", "Michael", "James", "John", "Daniel", "Matthew", "Andrew", "Christopher", "Richard", "Thomas", "Joseph", "Charles", "Hans", "Alireza", "Shakhriyar", "Teimour", "Vassily", "Pentala", "Samuel", "Vincent", "Jan-Krzysztof", "Radoslaw", "Daniil", "Julio", "Francisco", "Luke", "Jeffery", "Benjamin", "Ray", "Leinier", "Lazaro", "Nikita", "Vladislav", "Parham", "Nodirbek", "Andrey", "Dmitry", "Alexandr", "Grigoriy", "Pavel", "Evgeny", "Nikolai", "Anatoly", "Mikhail", "Arjun", "Gukesh", "Praggnanandhaa"];
  const lastNames = ["Carlsen", "Caruana", "Nakamura", "So", "Aronian", "Vachier-Lagrave", "Giri", "Nepomniachtchi", "Anand", "Grischuk", "Karjakin", "Kramnik", "Gelfand", "Andreikin", "Svidler", "Fischer", "Kasparov", "Karpov", "Tal", "Petrosian", "Smyslov", "Botvinnik", "Alekhine", "Capablanca", "Lasker", "Steinitz", "Morphy", "Anderssen", "Niemann", "Firouzja", "Mamedyarov", "Radjabov", "Ivanchuk", "Harikrishna", "Shankland", "Keymer", "Duda", "Wojtaszek", "Dubov", "Granda Zuniga", "Vallejo Pons", "McShane", "Xiong", "Bok", "Robson", "Dominguez Perez", "Bruzon Batista", "Vitiugov", "Artemiev", "Maghsoodloo", "Abdusattorov", "Esipenko", "Andreikin", "Predojevic", "Oparin", "Eljanov", "Tomashevsky", "Jakovenko", "Karpov", "Erigaisi", "Dommaraju", "Rameshbabu"];

  const players: Player[] = Array(64)
    .fill(null)
    .map((_, i) => ({
      id: `player-${i}`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      rating: 1800 + Math.floor(Math.random() * 600),
      title: i < 5 ? ["GM", "IM", "FM"][Math.floor(Math.random() * 3)] : undefined,
      country: ["USA", "GER", "RUS", "IND", "CHN", "NOR", "FRA", "ESP", "UKR"][Math.floor(Math.random() * 9)],
      tournaments: [],
    }));

  const rounds: Round[] = Array(7)
    .fill(null)
    .map((_, roundIndex) => ({
      roundNumber: roundIndex + 1,
      date: `2024-03-${15 + roundIndex}`,
      games: Array(32)
        .fill(null)
        .map((_, gameIndex) =>
          generateMockGame(
            roundIndex + 1,
            players[gameIndex * 2],
            players[gameIndex * 2 + 1],
            gameIndex
          )
        ),
    }));

  return {
    id,
    name: "Spring Championship 2024",
    location: "New York Chess Club, Manhattan",
    startDate: "2024-03-15",
    endDate: "2024-03-17",
    timeControl: "90+30",
    format: "Swiss",
    status: "completed",
    description:
      "The annual Spring Championship brings together the best chess players from across the region. This prestigious tournament features 7 rounds of classical chess with a generous time control, allowing for deep strategic play and memorable games.",
    organizer: "NY Chess Association",
    prizePool: "$10,000",
    rounds,
    players,
  };
};

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedRound, setSelectedRound] = useState(1);
  
  // In a real app, fetch tournament data based on id
  const tournament = generateMockTournament(id || "1");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getResultBadge = (result: string) => {
    if (result === "1-0") return { text: "1-0", class: "bg-green-500 text-white dark:bg-green-600 dark:text-white font-bold" };
    if (result === "0-1") return { text: "0-1", class: "bg-red-500 text-white dark:bg-red-600 dark:text-white font-bold" };
    return { text: "½-½", class: "bg-gray-500 text-white dark:bg-gray-600 dark:text-white font-bold" };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Calculate standings
  const standings = tournament.players
    .map((player) => {
      let score = 0;
      let games = 0;
      tournament.rounds.forEach((round) => {
        round.games.forEach((game) => {
          if (game.whitePlayer.id === player.id) {
            games++;
            if (game.result === "1-0") score += 1;
            else if (game.result === "1/2-1/2") score += 0.5;
          } else if (game.blackPlayer.id === player.id) {
            games++;
            if (game.result === "0-1") score += 1;
            else if (game.result === "1/2-1/2") score += 0.5;
          }
        });
      });
      return { ...player, score, games };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/tournaments">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl h-fit">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 text-foreground">{tournament.name}</h1>
                {tournament.description && (
                  <p className="text-muted-foreground mb-4 max-w-3xl">
                    {tournament.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{tournament.timeControl}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{tournament.players.length} players</span>
                  </div>
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
                Export PGN
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="rounds" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="rounds" className="rounded-lg">Rounds & Games</TabsTrigger>
            <TabsTrigger value="standings" className="rounded-lg">Standings</TabsTrigger>
            <TabsTrigger value="players" className="rounded-lg">Players</TabsTrigger>
          </TabsList>

          {/* Rounds & Games Tab */}
          <TabsContent value="rounds" className="space-y-6">
            {/* Round Selector */}
            <Card className="p-6 bg-card rounded-2xl">
              <h3 className="font-semibold mb-4 text-foreground">Select Round</h3>
              <div className="flex flex-wrap gap-2">
                {tournament.rounds.map((round) => (
                  <Button
                    key={round.roundNumber}
                    variant={selectedRound === round.roundNumber ? "default" : "outline"}
                    onClick={() => setSelectedRound(round.roundNumber)}
                    className="rounded-lg"
                  >
                    Round {round.roundNumber}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Games Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {tournament.rounds
                .find((r) => r.roundNumber === selectedRound)
                ?.games.map((game, index) => {
                  const resultBadge = getResultBadge(game.result);
                  return (
                    <Link key={game.id} to={`/tournament/${tournament.id}/game/${game.id}`}>
                      <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card rounded-2xl hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-muted-foreground">
                            Board {index + 1}
                          </span>
                          <Badge className={`${resultBadge.class} rounded-full px-3 py-1 text-xs font-bold`}>
                            {resultBadge.text}
                          </Badge>
                        </div>

                        {/* Players */}
                        <div className="space-y-3">
                          {/* White Player */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2">
                              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                                {getInitials(game.whitePlayer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {game.whitePlayer.title && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0 rounded">
                                    {game.whitePlayer.title}
                                  </Badge>
                                )}
                                <p className="font-medium truncate text-foreground">{game.whitePlayer.name}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {game.whitePlayer.rating}
                              </p>
                            </div>
                          </div>

                          {/* Black Player */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2">
                              <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-sm font-medium">
                                {getInitials(game.blackPlayer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {game.blackPlayer.title && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0 rounded">
                                    {game.blackPlayer.title}
                                  </Badge>
                                )}
                                <p className="font-medium truncate text-foreground">{game.blackPlayer.name}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {game.blackPlayer.rating}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Game Info */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                          <span>{game.opening}</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card className="p-6 bg-card rounded-2xl">
              <h3 className="text-xl font-bold mb-6 text-foreground">Tournament Standings</h3>
              <div className="space-y-2">
                {standings.map((player, index) => (
                  <Link key={player.id} to={`/player/${player.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 text-center font-bold text-lg">
                          {index === 0 && <Medal className="h-6 w-6 text-yellow-500 mx-auto" />}
                          {index === 1 && <Medal className="h-6 w-6 text-gray-400 mx-auto" />}
                          {index === 2 && <Medal className="h-6 w-6 text-amber-700 mx-auto" />}
                          {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                        </div>
                        
                        <Avatar className="h-12 w-12 border-2">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {player.title && (
                            <Badge variant="secondary" className="text-xs px-2 py-0 rounded">
                              {player.title}
                            </Badge>
                          )}
                          <p className="font-semibold truncate text-foreground">{player.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Rating: {player.rating}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold">{player.score}</div>
                        <div className="text-xs text-muted-foreground">{player.games} games</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tournament.players.map((player) => (
                <Link key={player.id} to={`/player/${player.id}`}>
                  <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card rounded-2xl hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                          {getInitials(player.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {player.title && (
                            <Badge variant="secondary" className="text-xs px-2 py-0 rounded">
                              {player.title}
                            </Badge>
                          )}
                          {player.country && (
                            <span className="text-xs text-muted-foreground">{player.country}</span>
                          )}
                        </div>
                        <p className="font-semibold truncate mb-1 text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">Rating: {player.rating}</p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentDetail;
