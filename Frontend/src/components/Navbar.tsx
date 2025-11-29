import { UploadSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Link, useLocation } from "react-router-dom"
import { Trophy, Home, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface NavbarProps {
  onUploadClick?: () => void
}

export function Navbar({ onUploadClick }: NavbarProps) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <nav className="border-b sticky top-0 z-50 backdrop-blur-lg bg-background/95 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                NF3 Pro
              </h1>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
              <Link to="/">
                <Button 
                  variant={isActive("/") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 rounded-lg"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              
              <Link to="/tournaments">
                <Button 
                  variant={isActive("/tournaments") || location.pathname.startsWith("/tournament") || location.pathname.startsWith("/player") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 rounded-lg"
                >
                  <Trophy className="h-4 w-4" />
                  Tournaments
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="rounded-lg w-9 h-9 p-0"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            
            {onUploadClick && (
              <Button
                onClick={onUploadClick}
                className="flex items-center gap-2 transition-all duration-200 rounded-lg"
                size="sm"
              >
                <UploadSimple size={18} weight="regular" />
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
