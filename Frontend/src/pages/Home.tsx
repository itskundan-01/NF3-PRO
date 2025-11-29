import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Trophy, Users, Upload } from "lucide-react";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const featuredTournaments = [
    {
      id: 1,
      name: "Spring Championship 2024",
      location: "New York Chess Club",
      players: 64,
      rounds: 7,
      date: "March 15-17, 2024",
    },
    {
      id: 2,
      name: "City Open Tournament",
      location: "Downtown Arena",
      players: 128,
      rounds: 9,
      date: "April 5-7, 2024",
    },
    {
      id: 3,
      name: "Regional Masters Cup",
      location: "Grand Hotel",
      players: 32,
      rounds: 5,
      date: "May 10-12, 2024",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 bg-gradient-to-b from-primary to-primary/90">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <img src="/nf3-pro.png" alt="NF3 Pro Logo" className="h-20 sm:h-32 w-20 sm:w-32 object-contain" />
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
              Global Chess Tournament Archive
            </h1>
          </div>
          <p className="text-sm sm:text-lg lg:text-xl text-primary-foreground/90 mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            Digitize tournament scoresheets, explore games, and preserve chess history
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto px-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
              <Input
                type="text"
                placeholder="Search players, tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 h-12 sm:h-14 text-sm sm:text-base lg:text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mt-6 sm:mt-8 px-2">
            <a href="/tournaments" className="w-full sm:w-auto">
              <Button size="sm" variant="secondary" className="w-full sm:w-auto text-sm sm:text-base">
                <Trophy className="mr-2 h-4 w-4" />
                Browse Tournaments
              </Button>
            </a>
            <a href="/analyzer" className="w-full sm:w-auto">
              <Button size="sm" variant="secondary" className="w-full sm:w-auto text-sm sm:text-base">
                <Upload className="mr-2 h-4 w-4" />
                Upload Scoresheet
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-foreground">Featured Tournaments</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredTournaments.map((tournament) => (
              <a key={tournament.id} href={`/tournament/${tournament.id}`}>
                <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <Trophy className="h-6 sm:h-8 w-6 sm:w-8 text-accent flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-right ml-2">{tournament.date}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{tournament.name}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{tournament.location}</p>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 sm:h-4 w-3 sm:w-4" />
                      <span>{tournament.players} players</span>
                    </div>
                    <span>•</span>
                    <span>{tournament.rounds} rounds</span>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">15,234</div>
              <div className="text-sm sm:text-base text-muted-foreground">Games Archived</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">487</div>
              <div className="text-sm sm:text-base text-muted-foreground">Tournaments</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">8,921</div>
              <div className="text-sm sm:text-base text-muted-foreground">Players</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
