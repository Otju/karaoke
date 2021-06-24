import { ObjectType, Field } from 'type-graphql'
import { Song } from './song'

@ObjectType()
export class SongPagination {
  @Field(() => [Song])
  songs: Song[]

  @Field()
  totalDocs: number

  @Field()
  hasNextPage: boolean
}
