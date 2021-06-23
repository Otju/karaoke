import SongResolver from './song/resolver'

// Important: Add all your module's resolver in this
export const resolvers: [Function, ...Function[]] = [
  SongResolver,
  // UserResolver
  // AuthResolver
  // ...
]
