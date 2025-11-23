import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UploadSimple, Warning, CheckCircle, Info } from "@phosphor-icons/react"
import { parseCSV, parseImage, type ParseResult } from "@/lib/parseChessNotation"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGameLoaded: (pgn: string) => void
}

export function UploadDialog({
  open,
  onOpenChange,
  onGameLoaded,
}: UploadDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [result, setResult] = useState<ParseResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
      setProcessingStatus("")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setResult(null)
    setProcessingStatus("Processing file...")

    try {
      let parseResult: ParseResult

      const fileType = selectedFile.type
      const fileName = selectedFile.name.toLowerCase()

      if (fileType === "text/csv" || fileName.endsWith(".csv")) {
        setProcessingStatus("Parsing CSV file...")
        parseResult = await parseCSV(selectedFile)
      } else if (
        fileType.startsWith("image/") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg")
      ) {
        setProcessingStatus("Extracting text from image with OCR...")
        parseResult = await parseImage(selectedFile)
      } else {
        parseResult = {
          success: false,
          error: "Unsupported file format. Please upload CSV, PNG, or JPG files.",
        }
      }

      setResult(parseResult)

      if (parseResult.success && parseResult.pgn) {
        onGameLoaded(parseResult.pgn)
      }
    } catch (error) {
      setResult({
        success: false,
        error: `Unexpected error: ${error}`,
      })
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setResult(null)
    setIsProcessing(false)
    setProcessingStatus("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Chess Game</DialogTitle>
          <DialogDescription>
            Upload a CSV file with White/Black columns or an image containing
            chess notation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors duration-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadSimple
              size={48}
              weight="regular"
              className="mx-auto mb-4 text-muted-foreground"
            />
            <p className="text-sm text-foreground mb-2">
              {selectedFile ? selectedFile.name : "Click to select file"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports CSV, PNG, JPG
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{processingStatus}</p>
              <Progress value={undefined} className="w-full" />
              {processingStatus.includes("AI") && (
                <Alert className="transition-all duration-200">
                  <Info size={18} weight="regular" />
                  <AlertDescription className="text-xs">
                    Using AI vision model for enhanced accuracy...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {result && !isProcessing && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="transition-all duration-200"
            >
              {result.success ? (
                <CheckCircle size={18} weight="regular" />
              ) : (
                <Warning size={18} weight="regular" />
              )}
              <AlertDescription>
                {result.success
                  ? `Successfully loaded ${result.movesFound} move(s). Click "Done" to start analyzing.`
                  : result.error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={result?.success ? handleClose : handleUpload}
            disabled={!selectedFile || isProcessing}
          >
            {result?.success ? "Done" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
