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
      console.log("Tesseract OCR failed, falling back to Gemini vision API...")
      return await parseImageWithGemini(file)
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    console.log("Tesseract OCR error, falling back to Gemini vision API...")
    return await parseImageWithGemini(file)
  }
}

async function parseImageWithGemini(file: File): Promise<ParseResult> {
  try {
    const base64Image = await fileToBase64(file)
    const base64Data = base64Image.split(',')[1]
    const mimeType = file.type || 'image/jpeg'
    
    const API_KEY = "AIzaSyAa-8Cwh6_XixZemMocbQ3wRAI_KG_6KYE"
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
    
    const promptText = `You are a chess notation expert. Analyze this image which contains chess game notation and extract all the moves in standard PGN (Portable Game Notation) format.

Instructions:
1. Look for chess moves in standard algebraic notation (e.g., e4, Nf3, Bxc6, O-O, etc.)
2. Extract moves in sequence with their move numbers
3. Format the output as clean PGN notation: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
4. If you see castling, use O-O for kingside and O-O-O for queenside
5. Include check (+) and checkmate (#) symbols if present
6. Only return the moves, no additional text or explanation
7. If the image contains multiple games, extract the most complete one
8. If no valid chess notation is found, return "NO_NOTATION_FOUND"

Return ONLY the PGN notation or "NO_NOTATION_FOUND".`

    const requestBody = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }]
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} - ${await response.text()}`)
    }

    const data = await response.json()
    const trimmedResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    
    if (trimmedResponse === "NO_NOTATION_FOUND" || trimmedResponse.length < 5) {
      return {
        success: false,
        error: "Could not detect chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    const cleanedText = extractChessMoves(trimmedResponse)
    
    if (!cleanedText || cleanedText.length < 5) {
      return {
        success: false,
        error: "Could not detect valid chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
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
      error: `AI vision processing failed: ${error}`,
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
