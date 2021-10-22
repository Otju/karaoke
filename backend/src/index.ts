import 'reflect-metadata'
import express from 'express'
import { Application } from 'apollo-server-express/node_modules/@types/express-serve-static-core'
import mongoose from 'mongoose'

import loaders from './bootstrap/loaders'
import { config } from './config'
import serverless from 'serverless-http'

const getServer = async () => {
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

  return app
}

let handler: Function

module.exports.handler = async (event: any, context: any) => {
  if (!handler) {
    const app = await getServer()
    handler = serverless(app, {
      request: (request: any) => {
        request.serverless = { event, context }
      },
    })
  }

  const res = await handler(event, context)
  return res
}
