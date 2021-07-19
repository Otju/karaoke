import express from 'express'
import { Application } from 'apollo-server-express/node_modules/@types/express-serve-static-core'
import mongoose from 'mongoose'

import loaders from './loaders'
import { Config } from '../config'

export default async (config: Config) => {
  const app = express() as Application

  const server = await loaders(app)

  server.applyMiddleware({
    app,
    path: config.graphqlPath,
    // Health check on /.well-known/apollo/server-health
    onHealthCheck: async () => {
      if (mongoose.connection.readyState === 1) return

      throw new Error()
    },
  })

  app.listen({ port: config.port }, () =>
    console.log(`🚀 Server ready at http://localhost:${config.port}${config.graphqlPath}`)
  )
}
