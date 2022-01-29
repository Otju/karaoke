import { useEffect, useRef } from 'react'
import { ScoreInfo } from '../types/types'
import { roundRect } from '../utils/canvasHelpers'

interface props {
  scoreInfo?: ScoreInfo[]
}

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const EndScreen = ({ scoreInfo }: props) => {
  const canvasRef = useRef(null)

  if (!scoreInfo) {
    scoreInfo = [...Array(4)].map(() => ({
      score: randomIntFromInterval(50, 1000),
      hitNotes: 5,
      missedNotes: 100,
      scorePerNote: 500,
      calculatedNotePageIndexes: [],
    }))
  }

  useEffect(() => {
    const ratings = {
      Perfect: 1,
      Great: 0.8,
      Good: 0.6,
      Decent: 0.4,
      'Not that bad': 0.2,
    }
    const render = () => {
      const canvas = canvasRef.current
      if (canvas) {
        //@ts-ignore
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.lineWidth = 5
        ctx.fillStyle = 'grey' //'rgba(210, 210, 210, 0.1)'
        ctx.strokeStyle = 'grey' //'rgba(210, 210, 210, 0.1)'
        ctx.font = '20px Arial'
        const maxHeight = 350
        Object.entries(ratings).forEach(([name, value]: [string, number]) => {
          const y = 50 + 300 * (1 - value)
          ctx.rect(200, y, 600, 5)
          ctx.fill()
          ctx.fillText(name, 20, y + 6)
        })
        ctx.rect(200, 0, 600, 350)
        ctx.stroke()
        ctx.fillStyle = 'red'
        scoreInfo?.forEach(({ score }, i) => {
          const height = score / 5
          roundRect(ctx, 300 + i * 100, maxHeight - height, 50, height, 10, true, false)
        })
      }
    }
    requestAnimationFrame(() => render())
  }, [scoreInfo])

  return (
    <div className="endScreen">
      <h1>ENDSCREEN</h1>
      <div className="absCenter">
        <canvas ref={canvasRef} width={950} height={600} />
      </div>
    </div>
  )
}

export default EndScreen
