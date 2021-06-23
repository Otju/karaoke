import { Resolver, Arg, Query, Mutation, ID } from 'type-graphql'

import { ObjectId } from 'mongodb'
import { getModelForClass } from '@typegoose/typegoose'
import { Song } from '../../entities'
import { NewSongInput } from './input'

const SongModel = getModelForClass(Song)

@Resolver((of) => Song)
export default class SongResolver {
  @Query((returns) => Song)
  async getSong(@Arg('id') id: ObjectId) {
    const song = await SongModel.findById(id).lean().exec()
    return song
  }

  @Query((returns) => [Song])
  async getSongs() {
    const songs = await SongModel.find({})
    return songs
  }

  @Mutation((returns) => Song)
  async createSong(@Arg('songData') songData: NewSongInput): Promise<Song> {
    const { title, artist } = songData
    const alreadyExists = await SongModel.exists({ title, artist })
    if (alreadyExists) {
      throw new Error('Same song already exists')
    }
    return SongModel.create(songData)
  }

  @Mutation((returns) => Song)
  async updateVideoInfo(
    @Arg('id') id: ObjectId,
    @Arg('videoId') videoId: string,
    @Arg('gap') gap: number
  ): Promise<Song> {
    const newSong = await SongModel.findOneAndUpdate({ _id: id }, { videoId, gap }, { new: true })
    if (!newSong) {
      throw new Error("Coudn't find or update song")
    }
    return newSong
  }
}
