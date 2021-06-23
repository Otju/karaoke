export interface Octave {
  min: number
  max: number
  octave: number
  trueMax: number
  octaveNotes: OctaveNote[]
}

export interface OctaveNote {
  name: string
  freq: number
}

export interface Dimensions {
  height: number
  width: number
}

export interface Note {
  pitch: number
  name: string
  currentBeat: number
}

export interface SungNote {
  pitch: number
  name: string
  wholeBeat: number
}

export interface Song {
  _id: number
  title: string
  artist: string
  language: string
  year?: number
  bpm: number
  gap: number
  goldenNotes: boolean
  createdBy: string
  views: number
  rating: number
  ratingCount: number
  notePages: NotePage[]
  videoId?: string
  alternativeVideoIds?: string
}

export interface NotePageNote {
  beat: number
  length: number
  note: number
  lyric: string
  isSecondOctave: boolean
}

export interface NotePage {
  startBeat: number
  endBeat: number
  notes: NotePageNote[]
}