const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI

const connectMongooes = () => {
  mongoose
    .connect(MONGO_URI, {
      keepAlive: true,
    })
    .then(() => {
      console.log(`Connected to MongoDB`)
    })
    .catch((error) => {
      console.log(`Cannot connect to MongoDB`)
      console.error(error)
      process.exit(1)
    })
}

module.exports.connectMongoose = connectMongooes
