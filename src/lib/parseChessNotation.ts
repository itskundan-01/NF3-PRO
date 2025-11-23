import Papa from "papaparse"
import { createWorker, PSM } from "tesseract.js"
import { Chess } from "chess.js"

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

    if (!cleanedText || !validatePgn(cleanedText)) {
      console.log("Tesseract OCR failed to extract valid PGN, falling back to Gemini vision API...")
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
    
    const promptText = `You are a chess notation expert. Analyze this image which contains chess game notation and extract all the moves in standard PGN format.

CRITICAL REQUIREMENTS:
1. Extract moves in standard algebraic notation (e.g., e4, Nf3, Bxc6, O-O)
2. Format as: 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
3. Use O-O for kingside castling and O-O-O for queenside (capital letter O, not zero)
4. Include move numbers followed by a period and space
5. Separate white and black moves with spaces
6. Return ONLY the raw PGN moves without any formatting, code blocks, or explanations
7. Do NOT wrap in markdown code blocks
8. Do NOT add any text before or after the moves
9. If no chess notation found, return exactly: NO_NOTATION_FOUND

Example correct format: 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6

Extract the moves now:`

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
    let geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    
    if (geminiResponse === "NO_NOTATION_FOUND" || geminiResponse.length < 5) {
      return {
        success: false,
        error: "Could not detect chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    geminiResponse = geminiResponse
      .replace(/```pgn\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/##\s*/g, '')
      .trim()

    const cleanedText = extractChessMoves(geminiResponse)
    
    console.log("Gemini response:", geminiResponse)
    console.log("Cleaned PGN:", cleanedText)
    
    if (!cleanedText || cleanedText.length < 5) {
      return {
        success: false,
        error: "Could not detect valid chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    if (!validatePgn(cleanedText)) {
      console.error("Extracted PGN failed validation")
      return {
        success: false,
        error: "Extracted notation is not valid chess moves. Please check the image quality and try again.",
      }
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    console.error("Gemini API error:", error)
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
  const normalizedText = text
    .replace(/[oO0](-[oO0]){1,2}/g, (match) => {
      return match.length > 4 ? 'O-O-O' : 'O-O'
    })
    .replace(/\s+/g, ' ')
    .trim()
  
  const sequentialPattern = /(\d+)\.\s*([^\s\d]+)(?:\s+([^\s\d]+))?/g
  const moves: Array<{ white?: string; black?: string }> = []
  let match
  
  while ((match = sequentialPattern.exec(normalizedText)) !== null) {
    const moveNum = parseInt(match[1])
    const whiteMove = match[2]
    const blackMove = match[3]
    
    if (isValidMove(whiteMove)) {
      const entry = moves[moveNum - 1] || {}
      entry.white = cleanMove(whiteMove)
      moves[moveNum - 1] = entry
      
      if (blackMove && isValidMove(blackMove)) {
        entry.black = cleanMove(blackMove)
      }
    }
  }
  
  if (moves.length > 0) {
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
  
  const singleMovePattern = /[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O/g
  const allMoves = normalizedText.match(singleMovePattern)
  
  if (allMoves && allMoves.length >= 2) {
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
    
    return pgnText.trim()
  }
  
  return ""
}

function isValidMove(move: string): boolean {
  if (!move || move.length < 2) return false
  
  const cleanedMove = move.replace(/[+#?!]/g, '').trim()
  
  if (/^(O-O-O|O-O)$/i.test(cleanedMove)) {
    return true
  }
  
  if (!/[a-h][1-8]/.test(cleanedMove)) {
    return false
  }
  
  const validPattern = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?$/i
  return validPattern.test(cleanedMove)
}

function cleanMove(move: string): string {
  return move
    .replace(/^0-0-0$/i, 'O-O-O')
    .replace(/^0-0$/i, 'O-O')
    .trim()
}

function validatePgn(pgn: string): boolean {
  try {
    const testGame = new Chess()
    testGame.loadPgn(pgn)
    return testGame.history().length > 0
  } catch {
    return false
  }
}
