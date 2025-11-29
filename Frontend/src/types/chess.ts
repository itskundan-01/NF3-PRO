export interface PlayedMove {
  san: string
  isCustom: boolean
}

export interface MoveHistoryItem {
  moveNumber: number
  white: PlayedMove | null
  black: PlayedMove | null
}

export interface LastMove {
  from: string
  to: string
}

export interface PlayerInfo {
  name: string
  rating?: string
  timeRemaining?: number // in seconds
}

export interface GameMetadata {
  event?: string
  site?: string
  date?: string
  round?: string
  white: PlayerInfo
  black: PlayerInfo
  result?: string
  timeControl?: string // e.g., "40/5400+30:1800+30" or "90+30"
  clockTimes?: number[] // Array of time remaining in seconds for each half-move [white1, black1, white2, black2, ...]
}

export interface GameState {
  fen: string
  pgn: string
  moveHistory: MoveHistoryItem[]
  currentMoveIndex: number
  checkSquare?: string | null
  lastMove?: LastMove | null
  metadata?: GameMetadata
}

// Tournament Types
export interface Player {
  id: string
  name: string
  rating?: number
  title?: string // GM, IM, FM, etc.
  country?: string
  avatar?: string
  bio?: string
  tournaments: TournamentParticipation[]
  stats?: PlayerStats
}

export interface PlayerStats {
  totalGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  averageRating?: number
}

export interface TournamentParticipation {
  tournamentId: string
  tournamentName: string
  date: string
  score: string
  rank: number
  games: Game[]
}

export interface Tournament {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  timeControl: string
  rounds: Round[]
  players: Player[]
  format: string // Swiss, Round-robin, Knockout
  description?: string
  organizer?: string
  prizePool?: string
  status: 'upcoming' | 'ongoing' | 'completed'
}

export interface Round {
  roundNumber: number
  date: string
  games: Game[]
}

export interface Game {
  id: string
  roundNumber: number
  whitePlayer: Player
  blackPlayer: Player
  result: string // 1-0, 0-1, 1/2-1/2
  pgn: string
  date: string
  opening?: string
  moves?: number
  timeControl?: string
}
