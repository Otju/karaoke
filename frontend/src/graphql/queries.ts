export const SongQuery = `
  query ($id: ObjectId!){
    getSong(id: $id) {
      _id
      title
      artist
      language
      year
      bpm
      gap
      goldenNotes
      createdBy
      views
      rating
      ratingCount
      notePages {
        startBeat
        endBeat
        notes{
          beat
          length
          note
          lyric
          isSecondOctave
        }
      }
      videoId
      alternativeVideoIds
    }
  }
`

export const SongsQuery = `
query($searchString: String, $hasVideo: Boolean, $hasRightGap: Boolean, $page: Int!) {
  getSongs(searchString: $searchString, hasVideo: $hasVideo, hasRightGap: $hasRightGap, page: $page){
    totalDocs
    hasNextPage
    songs{
    _id
    title
    artist
    language
    year
    goldenNotes
    createdBy
    views
    rating
    ratingCount
    gapIsAutoGenerated
    videoId
  }
  }
}
`
