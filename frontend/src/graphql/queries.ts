export const SongQuery = `
  query ($id: ObjectId!){
    getSong(id: $id) {
      _id
      title
      artist
      bpm
      gap
      notePages {
        startBeat
        endBeat
        notes{
          type
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
      genres
      styles
      smallImage
      bigImage
    }
  }
}
`

export const FavoritesQuery = `
query($ids: [ObjectId!]) {
  getFavorites(ids: $ids){
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
      genres
      styles
      smallImage
      bigImage
  }
}
`
