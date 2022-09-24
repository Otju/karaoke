import { config } from './config'
import express from 'express'
import { Application } from 'apollo-server-express/node_modules/@types/express-serve-static-core'
import loaders from './bootstrap/loaders'
import mongoose from 'mongoose'

export const getServer = async () => {
  const app = express() as Application
  //@ts-ignore
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

  return app
}

getServer().then((app) =>
  app.listen({ port: config.port }, () =>
    console.log(`🚀 Server ready at http://localhost:${config.port}${config.graphqlPath}`)
  )
)
