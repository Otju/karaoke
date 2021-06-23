import { Max, Min } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class NotePageNoteInput {
  @Field()
  beat: number

  @Field()
  type: string

  @Field()
  length: number

  @Field()
  @Min(0)
  @Max(23)
  note: number

  @Field()
  noteName: string

  @Field()
  lyric: string

  @Field()
  isSecondOctave: boolean
}

@InputType()
export class NotePageInput {
  @Field()
  startBeat: number

  @Field()
  endBeat: number

  @Field(() => [NotePageNoteInput])
  notes: NotePageNoteInput[]
}

@InputType()
export class NewSongInput {
  @Field()
  title: string

  @Field()
  artist: string

  @Field()
  language: string

  @Field({ nullable: true })
  year?: number

  @Field({ nullable: true })
  edition?: string

  @Field({ nullable: true })
  genre?: string

  @Field()
  bpm: number

  @Field()
  gap: number

  @Field()
  goldenNotes: boolean

  @Field()
  createdBy: string

  @Field()
  views: number

  @Field()
  rating: number

  @Field()
  ratingCount: number

  @Field(() => [NotePageInput])
  notePages: NotePageInput[]

  @Field({ nullable: true })
  videoId?: string

  @Field(() => [String], { nullable: true })
  alternativeVideoIds?: string[]
}
