import Canvas from './Canvas'
import SkipButton from './SkipButton'
import { getWindowDimensions } from '../hooks/useWindowDimensions'
import { Song } from '../types/types'
import { Link } from 'react-router-dom'

interface props {
  startTime: number
  handleTimeChange: (value: number) => void
  song: Song
  parsedID: string
  id: string
}

const SyncPage = ({ startTime, handleTimeChange, song, parsedID, id }: props) => {
  const { width, height } = getWindowDimensions()

  return (
    <>
      <div className="absCenterX syncControls">
        <h3>Vocals start at: {(startTime / 1000).toFixed(2)}s </h3>
        <div>
          <SkipButton amount={-10} onClick={handleTimeChange} />
          <SkipButton amount={-1} onClick={handleTimeChange} />
          <SkipButton amount={-0.1} onClick={handleTimeChange} />
          <SkipButton amount={-0.01} onClick={handleTimeChange} />
          <SkipButton amount={0.01} onClick={handleTimeChange} />
          <SkipButton amount={0.1} onClick={handleTimeChange} />
          <SkipButton amount={1} onClick={handleTimeChange} />
          <SkipButton amount={10} onClick={handleTimeChange} />
        </div>
        <Link to={`/tweak/${id}/`}>
          <button className="bigButton">Ready!</button>
        </Link>
      </div>
      <div className="absCenter">
        <Canvas
          songInfo={{ ...song, gap: startTime, videoId: parsedID }}
          startTime={startTime}
          width={width}
          height={height - 10}
          tuners={[]}
          lyricPlayMode={true}
        />
      </div>
    </>
  )
}

export default SyncPage
