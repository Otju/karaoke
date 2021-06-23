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
query {
  getSongs {
    _id
    title
    artist
    language
    year
    gap
    goldenNotes
    createdBy
    views
    rating
    ratingCount
    videoId
  }
}
`
