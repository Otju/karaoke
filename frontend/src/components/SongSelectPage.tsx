import { Song, ColorClass } from '../types/types'
import { AiFillYoutube, AiFillHourglass, AiOutlineSearch } from 'react-icons/ai'
import { useQuery } from 'urql'
import InfiniteScroll from 'react-infinite-scroll-component'
import { SongsQuery } from '../graphql/queries'
import useInput from '../hooks/useInput'
import { useState } from 'react'
import CrossedIcon from './CrossedIcon'
import useCheckBox from '../hooks/useCheckBox'
import { useEffect } from 'react'
import SongListItem from './SongListItem'

const SongSelectPage = () => {
  const [searchString, setSearchString] = useState('')
  const [page, setPage] = useState(1)
  const [songs, setSongs] = useState<Set<Song>>(new Set())

  const resetSongPage = () => {
    setSongs(new Set())
    setPage(1)
  }

  const handleSetSearh = (string: string) => {
    setSearchString(string)
    resetSongPage()
  }

  const search = useInput({
    placeholder: 'Search by title, artist, genre, language...',
    Icon: AiOutlineSearch,
    handleClick: handleSetSearh,
  })

  const hasRightGap = useCheckBox({
    Icon: AiFillHourglass,
    color: 'var(--warningColor)',
    tooltip: 'Include songs that mignt not be synced correctly',
    defaultValue: false,
    onClick: () => {
      resetSongPage()
      hasVideo.setValue(true)
    },
  })

  const hasVideo = useCheckBox({
    Icon: AiFillYoutube,
    color: 'var(--dangerColor)',
    tooltip: "Include songs that don't have a video",
    defaultValue: true,
    onClick: () => {
      resetSongPage()
      hasRightGap.setValue(false)
    },
  })

  const [result] = useQuery({
    query: SongsQuery,
    variables: {
      searchString,
      hasVideo: hasVideo.value,
      hasRightGap: hasRightGap.value,
      page,
    },
  })

  const { data, error } = result

  useEffect(() => {
    if (!result.fetching && !result.error && result.data) {
      const newSongs = result.data.getSongs.songs as Song[]
      setSongs((oldSongs) => new Set([...oldSongs, ...newSongs]))
    }
  }, [result])

  if (error) return <p>Oh no... {error.message}</p>

  const rows: React.ReactElement[][] = []

  let i = 0
  songs.forEach(
    ({
      title,
      artist,
      videoId,
      gapIsAutoGenerated,
      smallImage,
      bigImage,
      genres,
      year,
      language,
      _id,
    }) => {
      const rowNumber = Math.floor(i / 2)
      const isEven = i % 2 === 0
      let colorClass: ColorClass = ''
      let icon = <></>
      if (!videoId) {
        icon = <CrossedIcon Icon={AiFillYoutube} tooltip="No YouTube video" size={40} />
        colorClass = 'dangerColor'
      } else if (gapIsAutoGenerated) {
        icon = (
          <CrossedIcon
            Icon={AiFillHourglass}
            tooltip="Video might not be synced with lyrics"
            size={40}
          />
        )
        colorClass = 'warningColor'
      }
      const item = (
        <SongListItem
          _id={_id}
          title={title}
          artist={artist}
          smallImage={smallImage}
          icon={icon}
          colorClass={colorClass}
          bigImage={bigImage}
          language={language}
          year={year}
          genres={genres}
          videoId={videoId}
        />
      )
      if (isEven) {
        rows[rowNumber] = [item]
      } else {
        rows[rowNumber].push(item)
      }
      i++
    }
  )

  return (
    <div className="centerX">
      <div className="SongSelectPageContainer">
        <div>
          <div className="searchOptions">
            {search.field}
            {hasVideo.field}
            {hasRightGap.field}
          </div>
          <h3>{data?.getSongs?.totalDocs || '?'} songs matched search</h3>
        </div>
        {songs ? (
          songs.size === 0 ? (
            <div>No song matched search</div>
          ) : (
            <InfiniteScroll
              dataLength={rows.length}
              next={() => setPage(page + 1)}
              hasMore={data.getSongs.hasNextPage}
              loader={<h4>Loading...</h4>}
              endMessage={<h3>--------------------------------------</h3>}
              className="scrollDiv"
              style={{ overflow: 'hidden' }}
            >
              {rows.map(([item1, item2], i) => (
                <div className="songListRow" key={i}>
                  {item1}
                  {item2}
                </div>
              ))}
            </InfiniteScroll>
          )
        ) : null}
      </div>
    </div>
  )
}

export default SongSelectPage
