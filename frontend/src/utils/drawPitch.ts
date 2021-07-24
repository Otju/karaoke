import { SungNote, Dimensions, NotePage, ScoreInfo, NotePageNote, Settings } from '../types/types'
import {
  roundRect,
  calcbeatLength,
  beatToX,
  noteToY,
  drawDashedLine,
  getSungNoteIndex,
} from './canvasHelpers'

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
  settings: Settings,
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

    const calculateIsRightNote = (
      currentNote: NotePageNote,
      sungNoteName: string,
      snapAmount: number
    ) => {
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

    const parseSungNote = (beat: number, sungNoteName: string | undefined, snapAmount: number) => {
      if (!sungNoteName) return null
      const currentNote = currentNotePage.notes.find(
        ({ beat: notePageBeat, length }) => beat >= notePageBeat && beat < notePageBeat + length
      )
      if (!currentNote) return null
      const { sungNoteIndex, isRightNote } = calculateIsRightNote(
        currentNote,
        sungNoteName,
        snapAmount
      )
      return { sungNoteIndex, isRightNote, currentNote }
    }

    const newScores: ScoreInfo[] = []

    timedSungNotes.forEach((sungNotes, playerIndex) => {
      //Draw Sung notes
      const difficulty = settings.playerSettings[playerIndex].difficulty
      const snapAmounts = { Expert: 0, Hard: 1, Normal: 2, Easy: 3, 'Auto-Play': 24 }
      const snapAmount = snapAmounts[difficulty]
      sungNotes.forEach(({ beat, name }, sungNoteIndexInNotes) => {
        const parsed = parseSungNote(beat, name, snapAmount)
        if (parsed) {
          const { sungNoteIndex, isRightNote } = parsed
          const previousSungNote =
            sungNoteIndexInNotes > 0 ? sungNotes[sungNoteIndexInNotes - 1] : sungNotes[0]
          const nextSungNote = sungNotes[sungNoteIndexInNotes + 1]
          const parsedPreviousNote = parseSungNote(
            previousSungNote?.beat,
            previousSungNote?.name,
            snapAmount
          )
          const parsedNextNote = parseSungNote(nextSungNote?.beat, nextSungNote?.name, snapAmount)
          const dummy = { sungNoteIndex: 0 }
          const { sungNoteIndex: previousSungNoteIndex } = parsedPreviousNote || dummy
          const { sungNoteIndex: nextSungNoteIndex } = parsedNextNote || dummy
          const relativeBeat = beat - startBeat
          const x = beatToX({ relativeBeat, beatLength, beatMargin })
          const { height, noteTopMargin, color, transparentColor } = marginsForPlayers[playerIndex]
          const y = noteToY({ note: sungNoteIndex, noteTopMargin, height })
          ctx.fillStyle = isRightNote ? color : transparentColor
          const width = 20
          const length = beatLength / 4
          if (sungNoteIndex !== previousSungNoteIndex) {
            //Start of note
            roundRect(ctx, x - 5, y, length + 5, width, { tl: 5, bl: 5 }, true, false)
          } else if (sungNoteIndex !== nextSungNoteIndex) {
            //End of note
            roundRect(ctx, x, y, length, width, { tr: 5, br: 5 }, true, false)
          } else {
            //Middle of note
            ctx.fillRect(x, y, length, width)
          }
        }

        const isLastBeatOfPage = Math.round(beat) === currentNotePage.endBeat
        let newScore = scoreInfo[playerIndex]
        if (isLastBeatOfPage) {
          const scoreIsAlreadyCalculated =
            newScore.calculatedNotePageIndexes.includes(currentNotePageIndex)
          if (!scoreIsAlreadyCalculated) {
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
                const { isRightNote } = calculateIsRightNote(currentNote, name, snapAmount)
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
            newScore.calculatedNotePageIndexes =
              newScore.calculatedNotePageIndexes.concat(currentNotePageIndex)
            let maxScoreForPageCount = 0
            currentNotePage.notes.forEach(({ type, length }) => {
              if (type === 'normal') {
                maxScoreForPageCount += length
              } else if (type === 'golden') {
                maxScoreForPageCount += length * 2
              }
            })
            const maxScoreForPage = maxScoreForPageCount * scorePerNote
            newScore.percentageOnPage = scoreForPage / maxScoreForPage
            newScore.addedAmount = scoreForPage
            newScores.push(newScore)
            if (playerIndex - 1 === playerCount) {
              setScoreInfo(newScores)
              clearSungNotes()
            }
          }
        }
      })
    })
  }
}

export default drawPitch
