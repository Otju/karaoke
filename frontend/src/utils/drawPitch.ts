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
  canvasheight: number
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

const noteToY = ({ canvasheight, noteBottomMargin = 160, noteTopMargin = 200, note }: NoteToY) => {
  const heightLeft = canvasheight - noteBottomMargin - noteTopMargin
  const y = noteTopMargin + heightLeft - heightLeft * ((note + 1) / 24)
  return y
}

const getSungNoteIndex = (name: string) => {
  const parsedName = `${name.replace(/\d+/, '')}`
  return noteNames.findIndex((item) => item === parsedName)
}

const drawPitch = (
  ctx: any,
  currentBeat: number,
  sungNotes: SungNote[],
  setSungNotes: Function,
  pageSize: Dimensions,
  notePages: NotePage[],
  snapAmount: number,
  scoreInfo: ScoreInfo,
  setScoreInfo: Function
) => {
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

    currentNotePage.notes.forEach(({ beat, length, note, lyric, type }) => {
      const relativeBeat = beat - startBeat
      const x = beatToX({ relativeBeat, beatLength, beatMargin })
      const y = noteToY({ canvasheight, note })
      let fillColor = 'grey'
      if (type === 'golden') {
        fillColor = 'gold'
      } else if (type === 'free') {
        fillColor = 'green'
      }
      ctx.fillStyle = fillColor
      roundRect(ctx, x, y, length * beatLength, 20, 5, true, false)
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

    const parseSungNote = (wholeBeat: number, sungNoteName: string | undefined) => {
      if (!sungNoteName) return null
      const currentNote = currentNotePage.notes.find(
        ({ beat, length }) => wholeBeat >= beat && wholeBeat < beat + length
      )
      if (!currentNote) return null
      const { sungNoteIndex, isRightNote } = calculateIsRightNote(currentNote, sungNoteName)
      return { sungNoteIndex, isRightNote, currentNote }
    }

    sungNotes.forEach(({ wholeBeat, name }) => {
      const parsed = parseSungNote(wholeBeat, name)
      if (parsed) {
        const { sungNoteIndex, isRightNote, currentNote } = parsed
        const relativeBeat = wholeBeat - startBeat
        const x = beatToX({ relativeBeat, beatLength, beatMargin })
        const y = noteToY({ note: sungNoteIndex, canvasheight })
        ctx.fillStyle = isRightNote ? 'blue' : 'rgba(0, 0, 255, 0.3)'
        const greyFixedBeatLength = beatLength + (isRightNote ? 1 : 0)
        const width = 20
        const { beat, length } = currentNote
        if (wholeBeat === beat) {
          //Start of note
          roundRect(ctx, x, y, greyFixedBeatLength, width, { tl: 5, bl: 5 }, true, false)
        } else if (wholeBeat === beat + length - 1) {
          //End of note
          roundRect(ctx, x, y, greyFixedBeatLength, width, { tr: 5, br: 5 }, true, false)
        } else {
          ctx.fillRect(x, y, greyFixedBeatLength, width)
        }
      }
      const isLastBeatOfPage = wholeBeat === currentNotePage.endBeat
      if (isLastBeatOfPage) {
        let newScore = scoreInfo
        let scoreForPage = 0
        currentNotePage.notes.forEach((currentNote) => {
          const { beat, length } = currentNote
          const sungNotesForNote = sungNotes.filter(
            ({ wholeBeat }) => wholeBeat >= beat && wholeBeat < beat + length
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
            const noteScore = currentNote.length * scoreInfo.scorePerNote * multiplier
            newScore.hitNotes++
            newScore.score += noteScore
            scoreForPage += currentNote.length * scoreInfo.scorePerNote * multiplier
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
        maxScoreForPage = maxScoreForPage * scoreInfo.scorePerNote
        newScore.percentageOnPage = scoreForPage / maxScoreForPage
        newScore.addedAmount = scoreForPage
        setScoreInfo(newScore)
        setSungNotes([])
      }
    })
  }
}

export default drawPitch
