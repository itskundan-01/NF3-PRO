import { Card } from "@/components/ui/card"
import { Clock, User, Trophy } from "@phosphor-icons/react"
import type { PlayerInfo } from "@/types/chess"

interface PlayerInfoPanelProps {
  player: PlayerInfo
  color: "white" | "black"
  isActive?: boolean
}

export function PlayerInfoPanel({ player, color, isActive = false }: PlayerInfoPanelProps) {
  const borderClass = isActive ? "border-primary border-2" : "border-border"
  const bgClass = color === "white" ? "bg-white/5" : "bg-black/5"
  
  return (
    <Card className={`p-4 ${borderClass} ${bgClass} transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-full ${color === "white" ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-800 dark:bg-gray-700"}`}>
            <User size={20} weight="duotone" className={color === "white" ? "text-gray-700 dark:text-gray-300" : "text-gray-300 dark:text-gray-100"} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base truncate" title={player.name}>
              {player.name}
            </p>
            {player.rating && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Trophy size={14} weight="fill" />
                <span>{player.rating}</span>
              </div>
            )}
          </div>
        </div>
        {player.timeRemaining !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
            <Clock size={16} weight="bold" />
            <span className="font-mono font-semibold text-sm">
              {formatTime(player.timeRemaining)}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
