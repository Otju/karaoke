import { useRef, useEffect } from 'react'
import { useState } from 'react'
import Wad from 'web-audio-daw'
import songData from '../data/Mamma-Mia.json'

const voice = new Wad({ source: 'mic' })
const tuner = new Wad.Poly()

const canvasheight = 500

const firstNotePage = songData.notePages[0]

console.log(firstNotePage)

tuner.setVolume(0)
tuner.add(voice)

const pitchToY = (pitch: number) => {
  const maxY = canvasheight - 20
  const minY = 20
  const maxPitch = 1760
  const minPitch = 80
  const multiplier = (maxY - minY) / (maxPitch - minPitch)
  const y = multiplier * pitch
  return y
}

const drawPitch = (ctx: any, pitch: number) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const y = pitchToY(pitch)
  console.log(y, pitch)
  ctx.beginPath()
  ctx.arc(240, y, 20, 0, Math.PI * 2, false)
  ctx.fillStyle = 'green'
  ctx.fill()
}

interface Note {
  pitch: number
  name: string
}
//@ts-ignore
const Canvas = (props) => {
  const [note, setNote] = useState<Note>({ pitch: 0, name: 'bruh' })
  const [id, setId] = useState(0)

  const start = () => {
    voice.play()
    tuner.updatePitch()
    render()
  }

  const render = () => {
    setNote({ pitch: tuner.pitch, name: tuner.noteName })
    setId(requestAnimationFrame(render))
  }

  const stop = () => {
    tuner.stopUpdatingPitch()
    cancelAnimationFrame(id)
  }

  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    //@ts-ignore
    const ctx = canvas.getContext('2d')
    drawPitch(ctx, note.pitch)
  }, [note])

  const { startBeat, endBeat } = firstNotePage

  return (
    <div>
      <h1>
        {note.pitch}:{note.name}
      </h1>
      <div
        style={{
          position: 'relative',
          width: '80%',
          height: 500,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {firstNotePage.notes.map(({ beat, length, note, lyric }) => {
          const relativeBeat = beat - startBeat
          const relativeEndBeat = endBeat - startBeat
          console.log(relativeBeat, relativeEndBeat)
          return (
            <div
              style={{
                background: 'red',
                position: 'absolute',
                height: '20px',
                width: length * 10,
                left: relativeBeat * 10,
                bottom: note * 20,
              }}
            >
              {lyric}
            </div>
          )
        })}
      </div>
      <button onClick={start}>START</button>
      <button onClick={stop}>STOP</button>
      <canvas ref={canvasRef} {...props} width={1000} height={canvasheight} />
    </div>
  )
}

export default Canvas
