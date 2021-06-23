import { Octave, SungNote, Dimensions, NotePage } from '../types/types'
import getOctaves from './getOctaves'
import { roundRect, closestIndex } from './canvasHelpers'

const octaves = getOctaves()

const drawPitch = (
  ctx: any,
  pitch: number,
  currentBeat: number,
  currentOctave: Octave | undefined,
  setCurrentOctave: Function,
  sungNotes: SungNote[],
  setSungNotes: Function,
  pageSize: Dimensions,
  notePages: NotePage[]
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
    ctx.font = '32px Arial'
    const { startBeat } = currentNotePage
    ctx.beginPath()
    const lineX = (currentBeat - startBeat) * 20
    ctx.moveTo(lineX, 0)
    ctx.lineTo(lineX, canvasheight)
    ctx.stroke()
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.fill()
    let notFilledLyrics = ''
    let filledLyrics = ''

    if(Math.floor(currentBeat)===startBeat-1){
      setCurrentOctave(null)
    }

    currentNotePage.notes.forEach(({ beat, length, note, lyric, isSecondOctave }) => {
      const calcOctave = () => {
        const isActive = beat <= currentBeat && beat + length >= currentBeat
        if (isActive) {
          const newCurrentOctaveIndex = octaves.findIndex(
            ({ min, max }) => pitch >= min && pitch < max
          )
          if (newCurrentOctaveIndex !== -1) {
            const newCurrentOctave = isSecondOctave
              ? octaves[newCurrentOctaveIndex - 1]
              : octaves[newCurrentOctaveIndex]
            setCurrentOctave(newCurrentOctave)
          }
        }
      }
      if (!currentOctave) calcOctave()
      const relativeBeat = beat - startBeat
      const x = relativeBeat * 20
      const y = canvasheight - canvasheight * (note / 24)
      ctx.fillStyle = '#FF0000'
      roundRect(ctx, x, y, length * 20, 30, 5, true, false)
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

    sungNotes.forEach(({ wholeBeat, name, pitch }) => {
      if (wholeBeat === currentNotePage.startBeat - 1) {
        setSungNotes([])
      }
      const currentNote = currentNotePage.notes.find(
        ({ beat, length }) => wholeBeat >= beat && wholeBeat < beat + length
      )
      if (currentNote && name && currentOctave) {
        let index = currentNote.note - 1
        const closestNoteToSungNoteIndex = closestIndex(
          pitch,
          currentOctave.octaveNotes.map(({ freq }) => freq)
        )
        const isRightNote = closestNoteToSungNoteIndex === index
        const relativeBeat = wholeBeat - startBeat
        const x = relativeBeat * 20
        const y = canvasheight - canvasheight * ((closestNoteToSungNoteIndex + 1) / 24)
        ctx.fillStyle = isRightNote ? 'blue' : 'rgba(0, 0, 255, 0.3)'
        const width = isRightNote ? 30 : 20
        const { beat, length } = currentNote
        if (wholeBeat === beat) {
          //Start of note
          roundRect(ctx, x, y, 20, width, { tl: 5, bl: 5 }, true, false)
        } else if (wholeBeat === beat + length - 1) {
          //End of note
          roundRect(ctx, x, y, 20, width, { tr: 5, br: 5 }, true, false)
        } else {
          ctx.fillRect(x, y, 20, width)
        }
      }
    })
  }
}

export default drawPitch
