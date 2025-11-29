import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Filter,
  ChevronRight
} from "lucide-react";
import { Tournament } from "@/types/chess";

// Helper to generate realistic player names
const generatePlayers = (count: number, minRating: number, maxRating: number) => {
  const firstNames = ["Magnus", "Fabiano", "Hikaru", "Wesley", "Levon", "Maxime", "Anish", "Ian", "Viswanathan", "Alexander", "Sergey", "Vladimir", "Boris", "Dmitry", "Peter", "Robert", "David", "Michael", "James", "John", "Daniel", "Matthew", "Andrew", "Christopher", "Richard", "Thomas", "Joseph", "Charles", "Hans", "Alireza", "Shakhriyar", "Teimour", "Vassily", "Pentala", "Samuel", "Vincent", "Jan-Krzysztof", "Radoslaw", "Daniil", "Julio", "Francisco", "Luke", "Jeffery", "Benjamin", "Ray", "Leinier", "Lazaro", "Nikita", "Vladislav", "Parham", "Nodirbek", "Andrey", "Alexandr", "Grigoriy", "Pavel", "Evgeny", "Nikolai", "Anatoly", "Mikhail", "Arjun", "Gukesh", "Praggnanandhaa"];
  const lastNames = ["Carlsen", "Caruana", "Nakamura", "So", "Aronian", "Vachier-Lagrave", "Giri", "Nepomniachtchi", "Anand", "Grischuk", "Karjakin", "Kramnik", "Gelfand", "Andreikin", "Svidler", "Fischer", "Kasparov", "Karpov", "Tal", "Petrosian", "Smyslov", "Botvinnik", "Alekhine", "Capablanca", "Lasker", "Steinitz", "Morphy", "Anderssen", "Niemann", "Firouzja", "Mamedyarov", "Radjabov", "Ivanchuk", "Harikrishna", "Shankland", "Keymer", "Duda", "Wojtaszek", "Dubov", "Granda Zuniga", "Vallejo Pons", "McShane", "Xiong", "Bok", "Robson", "Dominguez Perez", "Bruzon Batista", "Vitiugov", "Artemiev", "Maghsoodloo", "Abdusattorov", "Esipenko", "Predojevic", "Oparin", "Eljanov", "Tomashevsky", "Jakovenko", "Erigaisi", "Dommaraju", "Rameshbabu"];
  
  return Array(count).fill(null).map((_, i) => ({ 
    id: `p${i}`, 
    name: `${firstNames[i % firstNames.length]} ${lastNames[(i + 7) % lastNames.length]}`,
    rating: minRating + Math.floor(Math.random() * (maxRating - minRating)),
    tournaments: [],
  }));
};

// Mock data - replace with API call
const mockTournaments: Tournament[] = [
  {
    id: "1",
    name: "Spring Championship 2024",
    location: "New York Chess Club",
    startDate: "2024-03-15",
    endDate: "2024-03-17",
    timeControl: "90+30",
    format: "Swiss",
    status: "completed",
    description: "Annual spring championship featuring top players from across the region",
    organizer: "NY Chess Association",
    prizePool: "$10,000",
    rounds: [],
    players: generatePlayers(64, 2000, 2600),
  },
  {
    id: "2",
    name: "City Open Tournament",
    location: "Downtown Arena",
    startDate: "2024-04-05",
    endDate: "2024-04-07",
    timeControl: "40/120+30",
    format: "Swiss",
    status: "ongoing",
    description: "Open tournament welcoming players of all skill levels",
    organizer: "City Chess Federation",
    rounds: [],
    players: generatePlayers(128, 1800, 2600),
  },
  {
    id: "3",
    name: "Regional Masters Cup",
    location: "Grand Hotel Conference Center",
    startDate: "2024-05-10",
    endDate: "2024-05-12",
    timeControl: "90+30",
    format: "Round-robin",
    status: "upcoming",
    description: "Elite invitational tournament for titled players",
    organizer: "Regional Chess League",
    prizePool: "$25,000",
    rounds: [],
    players: generatePlayers(32, 2400, 2700).map(p => ({ ...p, title: "GM" })),
  },
  {
    id: "4",
    name: "Summer Rapid Championship",
    location: "Riverside Community Center",
    startDate: "2024-06-20",
    endDate: "2024-06-21",
    timeControl: "15+10",
    format: "Swiss",
    status: "upcoming",
    organizer: "State Chess Organization",
    rounds: [],
    players: generatePlayers(96, 1900, 2600),
  },
  {
    id: "5",
    name: "Junior Chess Championship",
    location: "School District Center",
    startDate: "2024-07-15",
    endDate: "2024-07-17",
    timeControl: "60+30",
    format: "Swiss",
    status: "upcoming",
    description: "Championship for junior players under 18",
    organizer: "Youth Chess Foundation",
    prizePool: "$5,000",
    rounds: [],
    players: generatePlayers(80, 1400, 2000),
  },
  {
    id: "6",
    name: "Autumn Blitz Festival",
    location: "City Chess Club",
    startDate: "2024-09-14",
    endDate: "2024-09-14",
    timeControl: "3+2",
    format: "Swiss",
    status: "upcoming",
    organizer: "Metropolitan Chess Society",
    rounds: [],
    players: generatePlayers(120, 1700, 2600),
  },
];

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchType, setSearchType] = useState<"tournaments" | "players">("tournaments");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSearchBlur = () => {
    if (searchQuery.trim().length === 0) {
      setIsSearchExpanded(false);
    }
  };

  const openSearch = () => setIsSearchExpanded(true);

  const filteredTournaments = mockTournaments.filter((tournament) => {
    const matchesFilter = filterStatus === "all" || tournament.status === filterStatus;

    if (searchType === "players") {
      const matchesPlayer = tournament.players.some(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesPlayer && matchesFilter;
    }

    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "ongoing":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "completed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Chess Tournaments</h1>
                  <p className="text-muted-foreground mt-1">Browse and explore chess competitions</p>
                </div>
              </div>

              <div className="w-full lg:w-auto flex items-center justify-end">
                {/* Desktop search */}
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Search</span>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      type="text"
                      placeholder={searchType === "tournaments" ? "Search tournaments" : "Search players"}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 rounded-full bg-card border border-border"
                    />
                  </div>
                </div>

                {/* Mobile collapsible search */}
                <div className="md:hidden relative h-12 w-full flex justify-end">
                  {!isSearchExpanded && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={openSearch}
                      aria-label="Open search"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  )}

                  {isSearchExpanded && (
                    <div className="relative w-full max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder={searchType === "tournaments" ? "Search tournaments..." : "Search players..."}
                        value={searchQuery}
                        autoFocus
                        onFocus={openSearch}
                        onBlur={handleSearchBlur}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-background border transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search mode & Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={searchType === "tournaments" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchType("tournaments")}
                  className="rounded-lg"
                >
                  Tournaments
                </Button>
                <Button
                  variant={searchType === "players" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchType("players")}
                  className="rounded-lg"
                >
                  Players
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className="rounded-lg"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "upcoming" ? "default" : "outline"}
                  onClick={() => setFilterStatus("upcoming")}
                  className="rounded-lg"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Upcoming
                </Button>
                <Button
                  variant={filterStatus === "ongoing" ? "default" : "outline"}
                  onClick={() => setFilterStatus("ongoing")}
                  className="rounded-lg"
                >
                  Ongoing
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("completed")}
                  className="rounded-lg"
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full bg-card border rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className={`${getStatusColor(tournament.status)} rounded-full px-3 py-1 text-xs font-medium`}>
                    {tournament.status}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 line-clamp-2 text-foreground">
                  {tournament.name}
                </h3>

                {/* Description */}
                {tournament.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {tournament.description}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{tournament.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(tournament.startDate)}</span>
                    {tournament.endDate !== tournament.startDate && (
                      <span> - {formatDate(tournament.endDate)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{tournament.timeControl}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>{tournament.players.length} players</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-medium rounded-full">
                      {tournament.format}
                    </Badge>
                    {tournament.prizePool && (
                      <Badge variant="outline" className="text-xs font-medium rounded-full">
                        {tournament.prizePool}
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredTournaments.length === 0 && (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
