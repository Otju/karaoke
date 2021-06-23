import { ObjectType, Field } from 'type-graphql'
import { prop } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'

@ObjectType()
export class NotePageNote {
  @prop()
  @Field()
  beat: number

  @prop()
  @Field()
  type: string

  @prop()
  @Field()
  length: number

  @prop()
  @Field()
  note: number

  @prop()
  @Field()
  noteName: string

  @prop()
  @Field()
  lyric: string

  @prop()
  @Field()
  isSecondOctave: boolean
}

@ObjectType()
export class NotePage {
  @prop()
  @Field()
  startBeat: number

  @prop()
  @Field()
  endBeat: number

  @prop()
  @Field(() => [NotePageNote])
  notes: NotePageNote[]
}

@ObjectType()
export class Song {
  @Field()
  readonly _id: ObjectId

  @prop()
  @Field(() => Date)
  createdAt: Date

  @prop()
  @Field()
  title: string

  @prop()
  @Field()
  artist: string

  @prop()
  @Field()
  language: string

  @prop()
  @Field({ nullable: true })
  year?: number

  @prop()
  @Field({ nullable: true })
  edition?: string

  @prop()
  @Field({ nullable: true })
  genre?: string

  @prop()
  @Field()
  bpm: number

  @prop()
  @Field()
  gap: number

  @prop()
  @Field()
  goldenNotes: boolean

  @prop()
  @Field()
  createdBy: string

  @prop()
  @Field()
  views: number

  @prop()
  @Field()
  rating: number

  @prop()
  @Field()
  ratingCount: number

  @prop()
  @Field(() => [NotePage])
  notePages: NotePage[]

  @prop()
  @Field({ nullable: true })
  videoId?: string

  @prop()
  @Field(() => [String], { nullable: true })
  alternativeVideoIds?: string[]
}
