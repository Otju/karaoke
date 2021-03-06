import { ObjectType, Field, Int } from 'type-graphql'
import { prop, index, plugin } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'
import mongoosePaginate from 'mongoose-paginate-v2'

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

  @prop({ max: 11, min: 0 })
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

@index(
  { title: 'text', artist: 'text', genres: 'text', styles: 'text', language: 'text' },
  { default_language: 'none', language_override: 'none' }
)
@ObjectType()
@plugin(mongoosePaginate)
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

  @prop({ default: 'English' })
  @Field()
  language?: string

  @prop()
  @Field(() => Int, { nullable: true })
  year?: number

  @prop()
  @Field({ nullable: true })
  edition?: string

  @prop()
  @Field(() => [String], { nullable: true })
  genres?: string[]

  @prop()
  @Field(() => [String], { nullable: true })
  styles?: string[]

  @prop()
  @Field({ nullable: true })
  smallImage?: string

  @prop()
  @Field({ nullable: true })
  bigImage?: string

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
  @Field()
  gapIsAutoGenerated: boolean

  @prop()
  @Field({ nullable: true })
  videoId?: string

  @prop()
  @Field(() => [String], { nullable: true })
  alternativeVideoIds?: string[]

  //@ts-ignore
  static paginate(search: Object, options: Object)
}
