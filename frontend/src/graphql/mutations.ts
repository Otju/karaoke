export const UpdateVideoInfo = `
mutation ($id: ObjectId!, $videoId: String!, $gap: Float!) {
  updateVideoInfo (id: $id, videoId: $videoId,  gap: $gap) {
    _id
    videoId
    gap
  }
}
`
