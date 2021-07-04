import { SungNote, Dimensions, NotePage, ScoreInfo, NotePageNote } from '../types/types'
import { roundRect } from './canvasHelpers'
import { noteNames } from './noteNames'

interface CalcBeatLength {
  canvaswidth: number
  startBeat: number
  endBeat: number
  beatMargin: number
}

interface BeatToX {
  relativeBeat: number
  beatLength: number
  beatMargin: number
}

interface NoteToY {
  height: number
  noteBottomMargin?: number
  noteTopMargin?: number
  note: number
}

const calcbeatLength = ({ canvaswidth, startBeat, endBeat, beatMargin }: CalcBeatLength) => {
  const beatAmount = endBeat - startBeat
  const beatLength = (canvaswidth - beatMargin * 2) / beatAmount
  return beatLength
}

const beatToX = ({ relativeBeat, beatLength, beatMargin }: BeatToX) => {
  const x = beatMargin + relativeBeat * beatLength
  return x
}

const noteToY = ({ height, noteTopMargin = 200, note }: NoteToY) => {
  const y = noteTopMargin + height - height * ((note + 1) / 24)
  return y
}

const getSungNoteIndex = (name: string) => {
  const parsedName = `${name.replace(/\d+/, '')}`
  return noteNames.findIndex((item) => item === parsedName)
}

interface DrawDashedLine {
  ctx: any
  pattern: number[]
  startY: number
  startX: number
  endX: number
}
const drawDashedLine = ({ ctx, pattern, startY, startX, endX }: DrawDashedLine) => {
  let y = startY
  ctx.beginPath()
  ctx.setLineDash(pattern)
  ctx.moveTo(endX, y)
  ctx.lineTo(startX, y)
  ctx.stroke()
  y += 20
}

interface marginForPlayer {
  height: number
  noteTopMargin: number
  color: string
  transparentColor: string
}

const drawPitch = (
  ctx: any,
  currentBeat: number,
  pageSize: Dimensions,
  notePages: NotePage[],
  snapAmount: number,
  scoreInfo: ScoreInfo[],
  setScoreInfo: (ScoreInfos: ScoreInfo[]) => void,
  marginsForPlayers: marginForPlayer[],
  clearSungNotes: () => void,
  timedSungNotes: SungNote[][]
) => {
  const playerCount = marginsForPlayers.length
  const canvasheight = pageSize.height
  const canvaswidth = pageSize.width
  const currentNotePageIndex = notePages.findIndex(
    ({ startBeat, endBeat }) => currentBeat >= startBeat - 1000 && currentBeat <= endBeat
  )
  const currentNotePage = notePages[currentNotePageIndex]
  const nextPageLyrics = notePages[currentNotePageIndex + 1]
    ? notePages[currentNotePageIndex + 1].notes.map(({ lyric }) => lyric).join('')
    : ''
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (currentNotePage) {
    const { startBeat, endBeat } = currentNotePage
    const beatMargin = 250
    const beatLength = calcbeatLength({ canvaswidth, startBeat, endBeat, beatMargin })
    ctx.font = '32px Arial'
    let notFilledLyrics = ''
    let filledLyrics = ''

    marginsForPlayers.forEach(({ height, noteTopMargin }, i) => {
      currentNotePage.notes.forEach(({ beat, length, note, type }) => {
        const relativeBeat = beat - startBeat
        const x = beatToX({ relativeBeat, beatLength, beatMargin })
        const y = noteToY({ note, noteTopMargin, height })
        let fillColor = 'grey'
        if (type === 'golden') {
          fillColor = 'gold'
        } /* else if (type === 'free') {
          fillColor = 'green'
        }
        */
        ctx.fillStyle = fillColor
        roundRect(ctx, x, y, length * beatLength, 20, 5, true, false)
      })
      if (i !== 0) {
        ctx.strokeStyle = 'grey'
        drawDashedLine({
          ctx,
          startY: noteTopMargin + height * 0.16,
          pattern: [10, 10],
          startX: beatMargin - 100,
          endX: canvaswidth - beatMargin + 100,
        })
      }
    })

    currentNotePage.notes.forEach(({ beat, lyric }) => {
      if (currentBeat >= beat) {
        filledLyrics += lyric
      } else {
        notFilledLyrics += lyric
      }
    })

    const centerOfCanvas = canvaswidth / 2
    const filledLength = ctx.measureText(filledLyrics).width
    const notFilledLength = ctx.measureText(notFilledLyrics).width
    const totalWidth = filledLength + notFilledLength
    const textX = centerOfCanvas - totalWidth / 2

    const nextPageLyricsX = centerOfCanvas - ctx.measureText(nextPageLyrics).width / 2
    const firstRowY = canvasheight - 80
    const secondRowY = canvasheight - 40
    ctx.fillStyle = 'red'
    ctx.fillText(filledLyrics, textX, firstRowY)
    ctx.fillStyle = 'white'
    ctx.fillText(notFilledLyrics, textX + filledLength, firstRowY)
    ctx.fillText(nextPageLyrics, nextPageLyricsX, secondRowY)

    const calculateIsRightNote = (currentNote: NotePageNote, sungNoteName: string) => {
      let rightNoteIndex = currentNote.note
      let sungNoteIndex = getSungNoteIndex(sungNoteName)
      const closenessToRightNote = Math.abs(sungNoteIndex - rightNoteIndex)
      const closenessToRightNoteOctaveHigher = Math.abs(sungNoteIndex + 12 - rightNoteIndex)
      if (closenessToRightNoteOctaveHigher < closenessToRightNote) {
        sungNoteIndex += 12
      }
      let isRightNote = false
      if (Math.abs(sungNoteIndex - rightNoteIndex) <= snapAmount) {
        sungNoteIndex = rightNoteIndex
        isRightNote = true
      }
      return { isRightNote, sungNoteIndex }
    }

    const parseSungNote = (beat: number, sungNoteName: string | undefined) => {
      if (!sungNoteName) return null
      const currentNote = currentNotePage.notes.find(
        ({ beat: notePageBeat, length }) => beat >= notePageBeat && beat < notePageBeat + length
      )
      if (!currentNote) return null
      const { sungNoteIndex, isRightNote } = calculateIsRightNote(currentNote, sungNoteName)
      return { sungNoteIndex, isRightNote, currentNote }
    }

    const newScores: ScoreInfo[] = []
    timedSungNotes.forEach((sungNotes, i) => {
      sungNotes.forEach(({ beat, name }) => {
        const parsed = parseSungNote(beat, name)
        if (parsed) {
          const { sungNoteIndex, isRightNote, currentNote } = parsed
          const relativeBeat = beat - startBeat
          const x = beatToX({ relativeBeat, beatLength, beatMargin })
          const { height, noteTopMargin, color, transparentColor } = marginsForPlayers[i]
          const y = noteToY({ note: sungNoteIndex, noteTopMargin, height })
          ctx.fillStyle = isRightNote ? color : transparentColor
          const greyFixedBeatLength = beatLength + (isRightNote ? 1 : 0)
          const width = 20
          const { beat: currentNoteBeat, length } = currentNote
          if (beat === currentNoteBeat) {
            //Start of note
            roundRect(ctx, x, y, greyFixedBeatLength, width, { tl: 5, bl: 5 }, true, false)
          } else if (beat === currentNoteBeat + length - 1) {
            //End of note
            roundRect(ctx, x, y, greyFixedBeatLength, width, { tr: 5, br: 5 }, true, false)
          } else {
            ctx.fillRect(x, y, greyFixedBeatLength, width)
          }
        }
        const isLastBeatOfPage = Math.ceil(beat) === currentNotePage.endBeat
        if (isLastBeatOfPage) {
          let newScore = scoreInfo[i]
          const { scorePerNote } = newScore
          let scoreForPage = 0
          currentNotePage.notes.forEach((currentNote) => {
            const { beat: currentNoteBeat, length } = currentNote
            const sungNotesForNote = sungNotes.filter(
              ({ beat }) => beat >= currentNoteBeat && beat < currentNoteBeat + length
            )
            const rightNotesForNote = sungNotesForNote.filter(({ name }) => {
              if (!name) {
                return false
              }
              const { isRightNote } = calculateIsRightNote(currentNote, name)
              return isRightNote
            })
            const percentageOfRight = rightNotesForNote.length / sungNotesForNote.length
            if (percentageOfRight > 0.7) {
              const multiplier = currentNote.type === 'golden' ? 2 : 1
              const noteScore = currentNote.length * scorePerNote * multiplier
              newScore.hitNotes++
              newScore.score += noteScore
              scoreForPage += currentNote.length * scorePerNote * multiplier
            } else {
              newScore.missedNotes++
            }
          })
          let maxScoreForPage = 0
          currentNotePage.notes.forEach(({ type, length }) => {
            if (type === 'normal') {
              maxScoreForPage += length
            } else if (type === 'golden') {
              maxScoreForPage += length * 2
            }
          })
          maxScoreForPage = maxScoreForPage * scorePerNote
          newScore.percentageOnPage = scoreForPage / maxScoreForPage
          newScore.addedAmount = scoreForPage
          newScores.push(newScore)
          if (i - 1 === playerCount) {
            setScoreInfo(newScores)
            clearSungNotes()
          }
        }
      })
    })
  }
}

export default drawPitch
