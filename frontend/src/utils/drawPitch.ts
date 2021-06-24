import { SungNote, Dimensions, NotePage } from '../types/types'
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

const drawPitch = (
  ctx: any,
  currentBeat: number,
  sungNotes: SungNote[],
  setSungNotes: Function,
  pageSize: Dimensions,
  notePages: NotePage[],
  snapAmount: number
) => {
  const canvasheight = pageSize.height
  const canvaswidth = pageSize.width
  const currentNotePageIndex = notePages.findIndex(
    ({ startBeat, endBeat }) => currentBeat >= startBeat - 20 && currentBeat <= endBeat
  )
  const currentNotePage = notePages[currentNotePageIndex]
  const nextPageLyrics = notePages[currentNotePageIndex + 1].notes
    .map(({ lyric }) => lyric)
    .join('')
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (currentNotePage) {
    const { startBeat, endBeat } = currentNotePage
    const beatMargin = 20
    const beatLength = calcbeatLength({ canvaswidth, startBeat, endBeat, beatMargin })
    ctx.font = '32px Arial'
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.fill()
    let notFilledLyrics = ''
    let filledLyrics = ''

    currentNotePage.notes.forEach(({ beat, length, note, lyric }) => {
      const relativeBeat = beat - startBeat
      const x = beatToX({ relativeBeat, beatLength, beatMargin })
      const y = noteToY({ canvasheight, note })
      ctx.fillStyle = 'grey'
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

    ctx.fillStyle = 'red'
    ctx.fillText(filledLyrics, textX, canvasheight - 60)
    ctx.fillStyle = 'white'
    ctx.fillText(notFilledLyrics, textX + filledLength, canvasheight - 60)
    ctx.fillText(nextPageLyrics, nextPageLyricsX, canvasheight - 20)

    sungNotes.forEach(({ wholeBeat, name }) => {
      if (wholeBeat === currentNotePage.startBeat - 1) {
        setSungNotes([])
      }
      const currentNote = currentNotePage.notes.find(
        ({ beat, length }) => wholeBeat >= beat && wholeBeat < beat + length
      )

      if (currentNote && name) {
        let rightNoteIndex = currentNote.note
        const coolName = `${name.replace(/\d+/, '')}`
        let sungNoteIndex = noteNames.findIndex((item) => item === coolName)
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
        const relativeBeat = wholeBeat - startBeat
        const x = beatToX({ relativeBeat, beatLength, beatMargin })
        const y = noteToY({ note: sungNoteIndex, canvasheight })
        ctx.fillStyle = isRightNote ? 'blue' : 'rgba(0, 0, 255, 0.3)'
        const width = 20
        const { beat, length } = currentNote
        if (wholeBeat === beat) {
          //Start of note
          roundRect(ctx, x, y, beatLength, width, { tl: 5, bl: 5 }, true, false)
        } else if (wholeBeat === beat + length - 1) {
          //End of note
          roundRect(ctx, x, y, beatLength, width, { tr: 5, br: 5 }, true, false)
        } else {
          ctx.fillRect(x, y, beatLength, width)
        }
      }
    })
  }
}

export default drawPitch
