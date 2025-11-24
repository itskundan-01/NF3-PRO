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
