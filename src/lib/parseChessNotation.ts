import Papa from "papaparse"
import { createWorker, PSM } from "tesseract.js"

export interface ParseResult {
  success: boolean
  pgn?: string
  error?: string
  movesFound?: number
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const data = results.data as Array<Record<string, string>>
          let pgn = ""
          let moveNumber = 1

          for (const row of data) {
            const white = row.White || row.white || ""
            const black = row.Black || row.black || ""

            if (!white && !black) continue

            if (white) {
              pgn += `${moveNumber}. ${white.trim()} `
            }
            if (black) {
              pgn += `${black.trim()} `
            }
            moveNumber++
          }

          if (pgn.trim().length === 0) {
            resolve({
              success: false,
              error: "No valid chess moves found in CSV",
            })
          } else {
            resolve({
              success: true,
              pgn: pgn.trim(),
              movesFound: moveNumber - 1,
            })
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse CSV: ${error}`,
          })
        }
      },
      error: (error) => {
        resolve({
          success: false,
          error: `CSV parsing error: ${error.message}`,
        })
      },
    })
  })
}

export async function parseImage(file: File): Promise<ParseResult> {
  try {
    const worker = await createWorker("eng", 1, {
      logger: () => {},
    })

    await worker.setParameters({
      tessedit_char_whitelist: 'abcdefghKQRBNOox012345678.-+=# ',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    })

    const {
      data: { text },
    } = await worker.recognize(file)

    await worker.terminate()

    const cleanedText = extractChessMoves(text)

    if (!cleanedText) {
      return {
        success: false,
        error: "Could not detect chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    return {
      success: false,
      error: `OCR processing failed: ${error}`,
    }
  }
}

function extractChessMoves(text: string): string {
  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0)
  const moves: Array<{ white?: string; black?: string }> = []
  
  const normalizedText = text
    .replace(/[oO0]/g, 'O')
    .replace(/[l1I|]/g, '1')
    .replace(/[S5]/g, 's')
    .replace(/\s+/g, ' ')
  
  const singleMovePattern = /([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O|0-0-0|0-0)/gi
  
  const linePattern = /(\d+)\s*\.?\s*([^\s]+)(?:\s+([^\s]+))?/
  
  for (const line of lines) {
    const normalizedLine = line
      .replace(/[oO0]/g, 'O')
      .replace(/[l1I|]/g, '1')
      .trim()
    
    const lineMatch = normalizedLine.match(linePattern)
    if (lineMatch) {
      const moveNum = parseInt(lineMatch[1])
      const whiteMove = lineMatch[2]
      const blackMove = lineMatch[3]
      
      if (isValidMove(whiteMove)) {
        const entry = moves[moveNum - 1] || {}
        entry.white = cleanMove(whiteMove)
        moves[moveNum - 1] = entry
      }
      
      if (blackMove && isValidMove(blackMove)) {
        const entry = moves[moveNum - 1] || {}
        entry.black = cleanMove(blackMove)
        moves[moveNum - 1] = entry
      }
    }
  }
  
  const allMoves = normalizedText.match(singleMovePattern)
  if (allMoves && allMoves.length > moves.filter(m => m.white || m.black).length * 1.5) {
    let pgnText = ""
    let moveNumber = 1
    
    for (let i = 0; i < allMoves.length; i += 2) {
      const white = cleanMove(allMoves[i])
      const black = allMoves[i + 1] ? cleanMove(allMoves[i + 1]) : ""
      
      if (isValidMove(white)) {
        pgnText += `${moveNumber}. ${white} `
        if (black && isValidMove(black)) {
          pgnText += `${black} `
        }
        moveNumber++
      }
    }
    
    if (pgnText.trim().length > 0) {
      return pgnText.trim()
    }
  }
  
  if (moves.length === 0) {
    return ""
  }
  
  let pgnText = ""
  moves.forEach((move, index) => {
    if (move.white || move.black) {
      pgnText += `${index + 1}. `
      if (move.white) {
        pgnText += `${move.white} `
      }
      if (move.black) {
        pgnText += `${move.black} `
      }
    }
  })
  
  return pgnText.trim()
}

function isValidMove(move: string): boolean {
  if (!move) return false
  
  const cleanedMove = move.replace(/[+#?!]/g, '').trim()
  
  if (/^(O-O-O|O-O|0-0-0|0-0)$/.test(cleanedMove)) {
    return true
  }
  
  if (!/[a-h][1-8]/.test(cleanedMove)) {
    return false
  }
  
  const validPattern = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?$/
  return validPattern.test(cleanedMove)
}

function cleanMove(move: string): string {
  return move
    .replace(/[oO0]/g, 'O')
    .replace(/[l|]/g, '1')
    .trim()
}
