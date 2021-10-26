import { getServer } from './index'
import { config } from './config'

getServer().then((app) =>
  app.listen({ port: config.port }, () =>
    console.log(`🚀 Server ready at http://localhost:${config.port}${config.graphqlPath}`)
  )
)
