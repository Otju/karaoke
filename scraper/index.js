require('dotenv').config()
const main = require('./src/getInfo')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const mainmain = async () => {
  //Wait for backend to start
  await sleep(10 * 1000)
  await main()
}

mainmain()
