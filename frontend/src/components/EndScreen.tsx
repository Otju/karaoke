import { useEffect, useRef } from 'react'
import { ScoreInfo } from '../types/types'
import getScoreText from '../utils/getScoreText'

interface props {
  scoreInfo?: ScoreInfo[]
}

const EndScreen = ({ scoreInfo }: props) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const ratings = {
      '10 000': 1,
      '8 000': 0.8,
      '6 000': 0.6,
      '4 000': 0.4,
      '2 000': 0.2,
      '0': 0,
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
        Object.entries(ratings).forEach(([name, value]: [string, number]) => {
          const y = 50 + 300 * (1 - value)
          ctx.rect(200, y, 600, 5)
          ctx.fill()
          ctx.fillText(name, 100, y + 6)
        })
        ctx.rect(200, 50, 600, 300)
        ctx.stroke()
      }
    }
    render()
  }, [])

  let totalAnimationDelay = 3

  return (
    <div className="endScreen">
      <div className="absCenter">
        {scoreInfo?.map(({ score }, i) => {
          const height = score / 32.25
          const animationDuration = 2 + height / 200
          const currentAnimationDelay = totalAnimationDelay - animationDuration
          totalAnimationDelay += animationDuration + 3
          const scoreText = getScoreText(score / 10000)
          return (
            <>
              <div
                style={{
                  height: 80,
                  position: 'absolute',
                  right: -100,
                  width: 200,
                  top: 20 + i * 90,
                  animationName: 'fadeInKeyFrames',
                  animationDelay: `${currentAnimationDelay + animationDuration}s`,
                  animationDuration: '3s',
                  animationFillMode: 'forwards',
                  opacity: '0%',
                }}
              >
                Player {i + 1} <br />
                Score: {score} <br />
                {scoreText ? scoreText[0] : 'Error'}
              </div>
              <div
                style={{
                  height: height,
                  position: 'absolute',
                  left: 320 + i * 100,
                  width: 50,
                  bottom: 246,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: -50,
                    width: '100%',
                  }}
                >
                  Player {i + 1}
                </div>
                <div
                  className="fillVerticalInner"
                  style={{
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${currentAnimationDelay}s`,
                  }}
                />
              </div>
            </>
          )
        })}
        <canvas ref={canvasRef} width={950} height={600} />
      </div>
    </div>
  )
}

export default EndScreen
