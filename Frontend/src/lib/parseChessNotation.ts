import Papa from "papaparse"
import { createWorker, PSM } from "tesseract.js"
import { Chess } from "chess.js"
import type { GameMetadata } from "@/types/chess"

export interface ParseResult {
  success: boolean
  pgn?: string
  error?: string
  movesFound?: number
  isPartial?: boolean
  totalMovesInImage?: number
  imageQualityWarning?: string
  metadata?: GameMetadata
}

function formatHistoryAsPgn(history: string[]): string {
  if (!history.length) {
    return ""
  }

  const segments: string[] = []
  for (let i = 0; i < history.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1
    const whiteMove = history[i]
    const blackMove = history[i + 1]

    if (!whiteMove && !blackMove) continue

    let fragment = `${moveNumber}. ${whiteMove ?? ""}`.trimEnd()
    if (blackMove) {
      fragment += ` ${blackMove}`
    }
    segments.push(fragment)
  }

  return segments.join(" ").trim()
}

function trimPgnToMoveCount(pgn: string, targetMoves: number): string | null {
  if (targetMoves <= 0) {
    return null
  }

  try {
    const chess = new Chess()
    chess.loadPgn(pgn)
    const history = chess.history()
    if (!history.length) {
      return null
    }

    const halfMovesToKeep = Math.min(history.length, targetMoves * 2)
    const trimmedHistory = history.slice(0, halfMovesToKeep)
    return formatHistoryAsPgn(trimmedHistory)
  } catch {
    return null
  }
}

function cleanPgnInput(input: string): string {
  if (!input) return ""

  return input
    .replace(/```pgn\s*/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "\n")
    .trim()
}

function extractPgnMetadata(pgnText: string): GameMetadata | undefined {
  if (!pgnText) return undefined
  
  const metadata: GameMetadata = {
    white: { name: "White" },
    black: { name: "Black" }
  }
  
  // Extract PGN headers [Tag "Value"]
  const eventMatch = pgnText.match(/\[Event\s+"([^"]+)"\]/i)
  const siteMatch = pgnText.match(/\[Site\s+"([^"]+)"\]/i)
  const dateMatch = pgnText.match(/\[Date\s+"([^"]+)"\]/i)
  const roundMatch = pgnText.match(/\[Round\s+"([^"]+)"\]/i)
  const whiteMatch = pgnText.match(/\[White\s+"([^"]+)"\]/i)
  const blackMatch = pgnText.match(/\[Black\s+"([^"]+)"\]/i)
  const resultMatch = pgnText.match(/\[Result\s+"([^"]+)"\]/i)
  const whiteEloMatch = pgnText.match(/\[WhiteElo\s+"([^"]+)"\]/i)
  const blackEloMatch = pgnText.match(/\[BlackElo\s+"([^"]+)"\]/i)
  const timeControlMatch = pgnText.match(/\[TimeControl\s+"([^"]+)"\]/i)
  
  if (eventMatch) metadata.event = eventMatch[1]
  if (siteMatch) metadata.site = siteMatch[1]
  if (dateMatch) metadata.date = dateMatch[1]
  if (roundMatch) metadata.round = roundMatch[1]
  if (resultMatch) metadata.result = resultMatch[1]
  if (timeControlMatch) metadata.timeControl = timeControlMatch[1]
  
  if (whiteMatch && whiteMatch[1] !== "?" && whiteMatch[1] !== "??") {
    metadata.white.name = whiteMatch[1]
  }
  if (blackMatch && blackMatch[1] !== "?" && blackMatch[1] !== "??") {
    metadata.black.name = blackMatch[1]
  }
  if (whiteEloMatch && whiteEloMatch[1] !== "?" && whiteEloMatch[1] !== "??") {
    metadata.white.rating = whiteEloMatch[1]
  }
  if (blackEloMatch && blackEloMatch[1] !== "?" && blackEloMatch[1] !== "??") {
    metadata.black.rating = blackEloMatch[1]
  }
  
  // Only return metadata if we found at least player names or event
  if (whiteMatch || blackMatch || eventMatch) {
    return metadata
  }
  
  return undefined
}

/**
 * Extract clock times from PGN annotations like { [%clk 0:03:00] }
 * Returns array of time remaining in seconds for each half-move
 */
export function extractClockTimes(pgnText: string): number[] | undefined {
  if (!pgnText) return undefined
  
  const clockTimes: number[] = []
  // Match patterns like { [%clk 0:03:00] } or { [%clk 0:00:30] }
  const clkPattern = /\{\s*\[%clk\s+(\d+):(\d+):(\d+)\]\s*\}/g
  let match
  
  while ((match = clkPattern.exec(pgnText)) !== null) {
    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    const seconds = parseInt(match[3])
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    clockTimes.push(totalSeconds)
  }
  
  return clockTimes.length > 0 ? clockTimes : undefined
}

export async function parsePgnTextInput(rawInput: string): Promise<ParseResult> {
  const cleanedInput = cleanPgnInput(rawInput)

  if (!cleanedInput) {
    return {
      success: false,
      error: "Please paste a valid PGN string.",
    }
  }

  const normalizedInput = normalizeNotation(cleanedInput)
  const metadata = extractPgnMetadata(normalizedInput)
  const clockTimes = extractClockTimes(normalizedInput)
  
  // Add clock times to metadata if found
  if (metadata && clockTimes) {
    metadata.clockTimes = clockTimes
  }
  
  const candidates = [normalizedInput]
  const stripped = stripPgnMetadata(normalizedInput)
  if (stripped && stripped !== normalizedInput) {
    candidates.push(stripped)
  }

  for (const candidate of candidates) {
    try {
      const chess = new Chess()
      chess.loadPgn(candidate)
      const history = chess.history()

      if (history.length > 0) {
        return {
          success: true,
          pgn: formatHistoryAsPgn(history),
          movesFound: Math.ceil(history.length / 2),
          metadata,
        }
      }
    } catch {
      // fall through to validation flow
    }
  }

  const validationResult = validatePgnWithDetails(stripped || normalizedInput)

  if (validationResult.valid) {
    return {
      success: true,
      pgn: stripped || normalizedInput,
      movesFound: validationResult.moveCount,
      metadata,
    }
  }

  if (validationResult.partialPgn && validationResult.moveCount > 0) {
    return {
      success: true,
      pgn: validationResult.partialPgn,
      movesFound: validationResult.moveCount,
      isPartial: true,
      metadata,
    }
  }

  return {
    success: false,
    error: validationResult.failedAt
      ? `Unable to parse PGN. Problem detected near ${validationResult.failedAt}.`
      : "Unable to parse PGN. Please verify the notation and try again.",
  }
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
      return await parseImageWithGemini(file)
    }

    const validationResult = validatePgnWithDetails(cleanedText)
    if (!validationResult.valid) {
      return await parseImageWithGemini(file)
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    return await parseImageWithGemini(file)
  }
}

async function parseImageWithGemini(file: File): Promise<ParseResult> {
  try {
    const base64Image = await fileToBase64(file)
    const base64Data = base64Image.split(',')[1]
    const mimeType = file.type || 'image/jpeg'
    
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
    if (!API_KEY) {
      throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.")
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
    
    const promptText = `You are an expert chess analyst and handwriting recognition specialist. Your task is to carefully extract chess moves AND player information from this handwritten scoresheet image.

📋 SCORESHEET STRUCTURE:
- The image is a chess scoresheet, likely containing handwritten moves.
- It often has MULTIPLE COLUMNS of moves (e.g., moves 1-30 on the left, 31-60 on the right).
- Each section typically has columns: "White", "Black" (and sometimes "No." or "S.No").
- Player names are usually at the top.
- CRITICALLY IMPORTANT: Extract ALL visible moves from the image, even if handwriting is unclear or misaligned.

🔍 CRITICAL INSTRUCTIONS FOR HANDWRITING & ALIGNMENT:
1. **Misalignment**: The handwritten text may not be perfectly aligned with the printed lines. Trust the sequence of moves over strict vertical alignment. If a move drifts into the next column, infer it based on the move number sequence.
2. **Unclear Handwriting**:
   - Use CHESS CONTEXT. If a move looks like "Qd5" but the Queen cannot move there, look for similar legal moves (e.g., "Qd4", "Bd5", "Nd5").
   - Common confusions:
     - 'b' vs '6' vs 'h'
     - 'g' vs '9' vs 'a' vs 'q'
     - 'O-O' (castling) vs '0-0'
     - 'N' (Knight) vs 'K' (King) vs 'H'
     - '1' vs '7' vs '/'
     - 'x' (capture) might be faint or look like a scribble.
     - 'e' vs 'c'
     - 'd' vs 'cl'
3. **Messy/Crossed-out**: Ignore crossed-out text. Look for the final intended move.
4. **Incomplete/Cut-off**: If the image cuts off, extract as much as you can see clearly.

🧠 CHESS LOGIC VALIDATION (Step-by-Step):
- As you extract, mentally play the game from the starting position.
- If you see a move that is ILLEGAL, stop and re-evaluate the handwriting.
- Ask: "What legal move looks most like this scribble?"
- Example: If you see "R1", it might be "Re1" or "Ra1". If you see "00", it is "O-O".
- Ensure moves alternate White-Black correctly.
- Verify move numbers are sequential.

🔍 STEP-BY-STEP EXTRACTION PROCESS:

STEP 0 - EXTRACT PLAYER INFORMATION:
Look for player names at the top of the scoresheet:
- White player name (usually on LEFT side or labeled "White:")
- Black player name (usually on RIGHT side or labeled "Black:")
- Player ratings if visible (Elo/FIDE ratings)
- Event/tournament name if visible
- Date if visible
- Round number if visible

STEP 1 - READ EACH MOVE CAREFULLY:
For each row, identify:
- Move number (1, 2, 3, etc.)
- White's move in LEFT column
- Black's move in RIGHT column
- **HANDLE MULTIPLE COLUMNS**: If the scoresheet has a second set of columns (e.g. 31-60), continue reading there after the first set.

STEP 2 - INTERPRET HANDWRITING:
(See Critical Instructions above)

STEP 3 - VALIDATE EACH MOVE:
As you extract moves, mentally play them on the board:
- Does this move make sense given the current position?
- Is the piece able to reach that square?
- Does the notation match what's possible in this position?
- If a move seems illegal, re-examine the handwriting - what else could it be?

STEP 4 - COMMON PATTERNS TO RECOGNIZE:
- Opening moves: e4, d4, Nf3, Nc3, Bc4, Bb5, etc.
- Pawn captures: exd5, cxd4, etc.
- Piece moves with captures: Nxd5, Bxc6+, Qxd5
- Castling: O-O (kingside) or O-O-O (queenside) - written as 0-0 or 0-0-0
- Checks: move followed by "+"
- Checkmate: move followed by "#"

STEP 5 - SELF-VALIDATION:
After extracting all moves, review the complete game:
1. Start from position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
2. Play through each move mentally
3. If any move is impossible, re-check that move's handwriting
4. Look for common misreadings (a↔g, b↔h, c↔e, N↔K, O↔0)
5. Ensure moves alternate White-Black correctly
6. Verify move numbers are sequential

⚠️ CRITICAL RULES:
1. Castling MUST be: O-O or O-O-O (capital letter O, NOT zero)
2. Knight moves use "N" (not K or Kn)
3. Pawn moves have no piece letter (just "e4", not "Pe4")
4. Captures use "x": Nxd5, exd5
5. Each move must be LEGAL in the sequence

📤 OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "whiteName": "Magnus Carlsen",
  "blackName": "Fabiano Caruana",
  "whiteRating": "2882",
  "blackRating": "2835",
  "event": "World Championship 2018",
  "site": "London",
  "date": "2018.11.09",
  "round": "1",
  "moves": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7",
  "totalMoves": 7,
  "confidence": "high"
}

Rules for output:
- whiteName/blackName: Extract from top of scoresheet. If not found, use "White" and "Black"
- whiteRating/blackRating: Extract if visible (ratings like "2500", "1800", etc.). Omit if not found
- event: Tournament/event name if visible. Omit if not found
- site: Location if visible. Omit if not found
- date: Date in format YYYY.MM.DD if visible. Omit if not found
- round: Round number if visible. Omit if not found
- moves: PGN notation with move numbers, dots, and moves separated by spaces
- totalMoves: Total number of move pairs you can see in the scoresheet (count all rows with moves)
- confidence: "high" if all moves are clear, "medium" if some are unclear, "low" if handwriting is very difficult
- If no chess notation found, return: {"whiteName": "White", "blackName": "Black", "moves": "NO_NOTATION_FOUND", "totalMoves": 0, "confidence": "low"}

🎯 QUALITY CHECK:
Before returning your answer:
✓ Did you check for player names at the top?
✓ Did you check each ambiguous letter carefully?
✓ Did you mentally validate that all moves are legal?
✓ Did you convert all castling to O-O format (letter O)?
✓ Are move numbers sequential?
✓ Did you include ALL moves from the scoresheet?

Now carefully extract the player information and moves from this scoresheet image:`

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
    
    // Try to parse as JSON first
    let extractedMoves = ""
    let totalMovesInImage = 0
    let confidence = "unknown"
    let metadata: GameMetadata | undefined = undefined
    
    try {
      // Remove markdown code blocks if present
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        extractedMoves = parsed.moves || ""
        totalMovesInImage = parsed.totalMoves || 0
        confidence = parsed.confidence || "unknown"
        
        // Extract player metadata from Gemini response
        const whiteName = parsed.whiteName || "White"
        const blackName = parsed.blackName || "Black"
        
        // Only create metadata if we have meaningful player names (not just defaults)
        if (whiteName !== "White" || blackName !== "Black" || parsed.event || parsed.whiteRating || parsed.blackRating) {
          metadata = {
            white: {
              name: whiteName,
              rating: parsed.whiteRating || undefined
            },
            black: {
              name: blackName,
              rating: parsed.blackRating || undefined
            },
            event: parsed.event || undefined,
            site: parsed.site || undefined,
            date: parsed.date || undefined,
            round: parsed.round || undefined,
          }
        }
      } else {
        // Fallback to treating response as plain PGN
        extractedMoves = geminiResponse
      }
    } catch {
      // If JSON parsing fails, treat as plain PGN
      extractedMoves = geminiResponse
    }
    
    if (extractedMoves === "NO_NOTATION_FOUND" || extractedMoves.length < 5) {
      return {
        success: false,
        error: "Could not detect chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    extractedMoves = extractedMoves
      .replace(/```pgn\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/##\s*/g, '')
      .trim()
    
    extractedMoves = normalizeNotation(extractedMoves)

    // If Gemini returned properly formatted PGN (starts with "1."), use it directly
    let cleanedText = extractedMoves
    if (!/^1\.\s+/.test(cleanedText)) {
      // Otherwise, try to extract moves from unformatted text
      cleanedText = extractChessMoves(extractedMoves)
    }
    
    if (!cleanedText || cleanedText.length < 5) {
      return {
        success: false,
        error: "Could not detect valid chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    const validationResult = validatePgnWithDetails(cleanedText)
    if (!validationResult.valid) {
      
      if (validationResult.partialPgn && validationResult.moveCount > 0) {
        // Only show warning if we know total moves and didn't get them all
        const warningMessage = totalMovesInImage > 0 && validationResult.moveCount < totalMovesInImage
          ? `Only ${validationResult.moveCount} of ${totalMovesInImage} moves could be extracted from the image. Some moves may be unclear due to handwriting. Consider re-uploading a clearer image for complete game analysis.`
          : undefined
        
        let partialPgn = validationResult.partialPgn
        let partialMoveCount = validationResult.moveCount

        if (totalMovesInImage > 0 && partialMoveCount > totalMovesInImage) {
          const trimmed = trimPgnToMoveCount(partialPgn, totalMovesInImage)
          if (trimmed) {
            partialPgn = trimmed
            partialMoveCount = totalMovesInImage
          }
        }
        
        return {
          success: true,
          pgn: partialPgn,
          movesFound: partialMoveCount,
          isPartial: true,
          totalMovesInImage: totalMovesInImage > 0 ? totalMovesInImage : undefined,
          imageQualityWarning: warningMessage,
          metadata,
        }
      }
      
      return {
        success: false,
        error: `Extracted notation is not valid chess moves. Failed at move ${validationResult.failedAt}. Please check the image quality and try again.`,
      }
    }

    let moveCount = (cleanedText.match(/\d+\./g) || []).length

    if (totalMovesInImage > 0 && moveCount > totalMovesInImage) {
      const trimmed = trimPgnToMoveCount(cleanedText, totalMovesInImage)
      if (trimmed) {
        cleanedText = trimmed
        moveCount = totalMovesInImage
      }
    }
    
    // Only show warning if we have total count AND didn't extract all moves
    let warningMessage: string | undefined = undefined
    if (totalMovesInImage > 0 && moveCount < totalMovesInImage) {
      warningMessage = `Only ${moveCount} of ${totalMovesInImage} moves were extracted from the image. Some moves may be unclear due to handwriting. Consider uploading a clearer image for complete game analysis.`
    }

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
      isPartial: moveCount < totalMovesInImage,
      totalMovesInImage: totalMovesInImage > 0 ? totalMovesInImage : undefined,
      imageQualityWarning: warningMessage,
      metadata,
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

function stripPgnMetadata(text: string): string {
  if (!text) return ""

  let sanitized = text

  // Remove PGN header tags
  sanitized = sanitized.replace(/\[[^\]]*\]/g, " ")
  // Remove braces comments
  sanitized = sanitized.replace(/\{[^}]*\}/g, " ")
  // Remove semicolon comments
  sanitized = sanitized.replace(/;[^\n]*/g, " ")
  // Remove recursive parentheses variations
  let previous = sanitized
  do {
    previous = sanitized
    sanitized = sanitized.replace(/\([^()]*\)/g, " ")
  } while (sanitized !== previous)

  return sanitized.replace(/\s+/g, " ").trim()
}

function normalizeNotation(text: string): string {
  let normalized = text
    // Handle zeros (0) -> letter O
    .replace(/0\s*-\s*0\s*-\s*0/g, 'O-O-O')
    .replace(/0\s*-\s*0/g, 'O-O')
    // Handle lowercase o or Cyrillic О -> letter O
    .replace(/[oО]\s*-\s*[oО]\s*-\s*[oО]/gi, 'O-O-O')
    .replace(/[oО]\s*-\s*[oО]/gi, 'O-O')
    // Handle spaced O-O variations
    .replace(/\bO\s*-\s*O\s*-\s*O\b/g, 'O-O-O')
    .replace(/\bO\s*-\s*O\b/g, 'O-O')
  
  // Handle common OCR mistakes in castling
  normalized = normalized
    .replace(/\b00\b/g, 'O-O')           // Handles 00 without hyphens
    .replace(/\b000\b/g, 'O-O-O')        // Handles 000 without hyphens
    .replace(/\b0-0\b/g, 'O-O')          // Handles 0-0
    .replace(/\b0-0-0\b/g, 'O-O-O')      // Handles 0-0-0
  
  // Handle non-standard piece notation (Kn -> N, Ki -> K, Kt -> N)
  normalized = normalized
    .replace(/\bKn(?=[a-h1-8x-])/gi, 'N')
    .replace(/\bKt(?=[a-h1-8x-])/gi, 'N')
    .replace(/\bKi(?=[a-h1-8x-])/gi, 'K')

  // Handle captures with colons
  normalized = normalized.replace(/:/g, 'x')

  // Remove hyphens between piece and square (e.g. N-f3 -> Nf3)
  // But preserve O-O and O-O-O
  const castlingPlaceholder2 = 'CASTLE_SHORT_PLACEHOLDER'
  const castlingPlaceholder3 = 'CASTLE_LONG_PLACEHOLDER'
  
  normalized = normalized
    .replace(/O-O-O/g, castlingPlaceholder3)
    .replace(/O-O/g, castlingPlaceholder2)
  
  // Remove hyphens
  normalized = normalized.replace(/-/g, '')
  
  // Restore castling
  normalized = normalized
    .replace(new RegExp(castlingPlaceholder3, 'g'), 'O-O-O')
    .replace(new RegExp(castlingPlaceholder2, 'g'), 'O-O')

  return normalized
}

function extractChessMoves(text: string): string {
  let normalizedText = normalizeNotation(text)
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
  const normalizedMove = normalizeNotation(cleanedMove)
  
  if (/^(O-O-O|O-O)$/i.test(normalizedMove)) {
    return true
  }
  
  if (!/[a-h][1-8]/.test(normalizedMove)) {
    return false
  }
  
  const validPattern = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?$/i
  return validPattern.test(normalizedMove)
}

function cleanMove(move: string): string {
  let cleaned = move.trim()
  
  cleaned = normalizeNotation(cleaned)
  
  if (/^(O-O-O|O-O)$/i.test(cleaned)) {
    return cleaned.toUpperCase()
  }
  
  return cleaned
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

function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

function findClosestLegalMove(move: string, chess: Chess): string | null {
  const legalMoves = chess.moves()
  let bestMatch: string | null = null
  let minDistance = Infinity

  // Normalize the input move for comparison
  const normalizedInput = move.replace(/[+#x]/g, '').replace(/0/g, 'O')

  for (const legalMove of legalMoves) {
    const normalizedLegal = legalMove.replace(/[+#x]/g, '')
    
    // 1. Exact match (ignoring check/capture symbols)
    if (normalizedInput === normalizedLegal) return legalMove

    // 2. Levenshtein distance
    const distance = getLevenshteinDistance(normalizedInput, normalizedLegal)
    
    // Threshold: allow 1 or 2 edits depending on length
    // Increased threshold for better recovery of messy handwriting
    const threshold = normalizedInput.length > 3 ? 3 : 2
    
    if (distance <= threshold && distance < minDistance) {
      minDistance = distance
      bestMatch = legalMove
    }
  }
  
  return bestMatch
}

function matchSkeletonMove(input: string, chess: Chess): string | null {
  const legalMoves = chess.moves()
  const normalizedInput = input.replace(/[+#x]/g, '')
  
  // Strategy 1: Missing file (e.g. "B6" -> "Bf6")
  // Regex: Piece + Rank
  if (/^[RNBQK][1-8]$/.test(normalizedInput)) {
    const piece = normalizedInput[0]
    const rank = normalizedInput[1]
    // Find moves that start with this piece and end with this rank
    // e.g. Bf6 matches B...6
    const candidates = legalMoves.filter(m => {
      const cleanM = m.replace(/[+#x]/g, '')
      return cleanM.startsWith(piece) && cleanM.endsWith(rank) && cleanM.length === 3
    })
    if (candidates.length === 1) return candidates[0]
  }
  
  // Strategy 2: Missing rank (e.g. "Bf" -> "Bf6")
  if (/^[RNBQK][a-h]$/.test(normalizedInput)) {
    const piece = normalizedInput[0]
    const file = normalizedInput[1]
    const candidates = legalMoves.filter(m => {
      const cleanM = m.replace(/[+#x]/g, '')
      return cleanM.startsWith(piece + file) && cleanM.length === 3
    })
    if (candidates.length === 1) return candidates[0]
  }
  
  // Strategy 3: Missing piece (e.g. "f6" -> "Bf6" or "Nf6")
  // Only if "f6" (pawn move) is NOT legal (which is why we are here)
  if (/^[a-h][1-8]$/.test(normalizedInput)) {
    const square = normalizedInput
    const candidates = legalMoves.filter(m => {
      const cleanM = m.replace(/[+#x]/g, '')
      return cleanM.endsWith(square) && /^[RNBQK]/.test(cleanM) && cleanM.length === 3
    })
    if (candidates.length === 1) return candidates[0]
  }

  return null
}

function tryOcrCorrections(move: string, chess: Chess): string | null {
  // 0. Try skeleton matching (missing characters)
  const skeletonMatch = matchSkeletonMove(move, chess)
  if (skeletonMatch) {
    return skeletonMatch
  }

  // 1. Try fuzzy matching against all legal moves
  const fuzzyMatch = findClosestLegalMove(move, chess)
  if (fuzzyMatch) {
    return fuzzyMatch
  }

  // Then try specific disambiguation patterns
  // First, try disambiguation for ambiguous piece moves (Rd1 → Rcd1, Rfd1, etc.)
  if (/^[RNBQK][a-h]?[1-8]$/.test(move)) {
    const piece = move[0]
    const destination = move.slice(-2)
    const legalMoves = chess.moves()
    
    // Try adding file disambiguation (Ra1 → Raa1, Rba1, Rca1, etc.)
    for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const disambiguated = `${piece}${file}${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
    
    // Try adding rank disambiguation (Ra1 → R1a1, R2a1, etc.)
    for (const rank of ['1', '2', '3', '4', '5', '6', '7', '8']) {
      const disambiguated = `${piece}${rank}${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
  }
  
  // Try disambiguation for captures (Rxd1 → Rcxd1, Rfxd1, etc.)
  if (/^[RNBQK]x[a-h][1-8]$/.test(move)) {
    const piece = move[0]
    const destination = move.slice(-2)
    const legalMoves = chess.moves()
    
    for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const disambiguated = `${piece}${file}x${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
    
    for (const rank of ['1', '2', '3', '4', '5', '6', '7', '8']) {
      const disambiguated = `${piece}${rank}x${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
  }
  
  // Common OCR mistakes in handwritten chess notation
  const corrections = [
    // Number confusions in square names
    { pattern: /([a-h])6/g, replacement: '$15' },  // d6 → d5
    { pattern: /([a-h])5/g, replacement: '$16' },  // d5 → d6
    { pattern: /([a-h])3/g, replacement: '$14' },  // d3 → d4
    { pattern: /([a-h])4/g, replacement: '$13' },  // d4 → d3
    { pattern: /([a-h])2/g, replacement: '$13' },  // d2 → d3
    { pattern: /([a-h])7/g, replacement: '$18' },  // d7 → d8
    { pattern: /([a-h])8/g, replacement: '$17' },  // d8 → d7
    
    // Letter confusions: a↔g, e↔c, b↔h, l↔1
    { pattern: /Na(\d)/, replacement: 'Ng$1' },  // Na5 → Ng5
    { pattern: /Ng(\d)/, replacement: 'Na$1' },  // Ng5 → Na5
    { pattern: /Ba(\d)/, replacement: 'Bg$1' },  // Ba5 → Bg5
    { pattern: /Bg(\d)/, replacement: 'Ba$1' },  // Bg5 → Ba5
    { pattern: /Ra(\d)/, replacement: 'Rg$1' },  // Ra5 → Rg5
    { pattern: /Rg(\d)/, replacement: 'Ra$1' },  // Rg5 → Ra5
    { pattern: /Qa(\d)/, replacement: 'Qg$1' },  // Qa5 → Qg5
    { pattern: /Qg(\d)/, replacement: 'Qa$1' },  // Qg5 → Qa5
    { pattern: /a([1-8])/, replacement: 'g$1' }, // a5 → g5 (pawn moves)
    { pattern: /g([1-8])/, replacement: 'a$1' }, // g5 → a5 (pawn moves)
    { pattern: /b([1-8])/, replacement: 'h$1' }, // b5 → h5
    { pattern: /h([1-8])/, replacement: 'b$1' }, // h5 → b5
    { pattern: /c([1-8])/, replacement: 'e$1' }, // c5 → e5
    { pattern: /e([1-8])/, replacement: 'c$1' }, // e5 → c5
    { pattern: /d([1-8])/, replacement: 'a$1' }, // d5 → a5
    { pattern: /l/, replacement: '1' },          // l → 1
    { pattern: /1/, replacement: 'l' },          // 1 → l (rare)
  ]

  for (const { pattern, replacement } of corrections) {
    const corrected = move.replace(pattern, replacement)
    if (corrected !== move) {
      try {
        // Create a temporary chess instance to test the move
        const testChess = new Chess(chess.fen())
        const testMove = testChess.move(corrected)
        if (testMove) {
          return corrected
        }
      } catch {
        // Try next correction
      }
    }
  }

  return null
}

function validatePgnWithDetails(pgn: string): { valid: boolean; failedAt?: string; partialPgn?: string; moveCount: number } {
  const normalized = normalizeNotation(pgn)
  const cleanedPgn = stripPgnMetadata(normalized)

  try {
    const testGame = new Chess()
    testGame.loadPgn(cleanedPgn)
    const moveCount = Math.ceil(testGame.history().length / 2)
    if (moveCount === 0) {
      throw new Error("No moves parsed")
    }
    return { valid: true, moveCount }
  } catch (error) {
    const testGame = new Chess()
    let partialMoves: string[] = []
    let failedAtMove = ""
    let currentMoveNumber = 1
    const moves = cleanedPgn.split(/\s+/)
    
    for (let i = 0; i < moves.length; i++) {
      const token = moves[i].trim()
      if (!token) continue
      
      if (/^\d+\.$/.test(token)) {
        currentMoveNumber = parseInt(token)
        continue
      }
      
      let cleanToken = token.replace(/\d+\./g, '').trim()
      if (!cleanToken) continue
      
      // Apply castling normalization to each individual token
      cleanToken = normalizeNotation(cleanToken)
      
      try {
        let attemptedMove = testGame.move(cleanToken)
        
        if (!attemptedMove) {
          throw new Error(`Illegal move`)
        }
        
        partialMoves.push(cleanToken)
      } catch (moveError) {
        // Try common OCR misreadings before giving up
        const correctedMove = tryOcrCorrections(cleanToken, testGame)
        
        if (correctedMove) {
          partialMoves.push(correctedMove)
          testGame.move(correctedMove)
          continue
        }
        
        failedAtMove = `${token} (move ${currentMoveNumber})`
        break
      }
    }
    
    if (partialMoves.length > 0) {
      let reconstructedPgn = ""
      for (let i = 0; i < partialMoves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1
        reconstructedPgn += `${moveNum}. ${partialMoves[i]}`
        if (partialMoves[i + 1]) {
          reconstructedPgn += ` ${partialMoves[i + 1]}`
        }
        reconstructedPgn += " "
      }
      
      return {
        valid: false,
        failedAt: failedAtMove || "end of game",
        partialPgn: reconstructedPgn.trim(),
        moveCount: Math.ceil(partialMoves.length / 2),
      }
    }
    
    return { valid: false, failedAt: failedAtMove || "start", moveCount: 0 }
  }
}
