require('dotenv').config()
const server = require('./server')
const mongooseConnection = require('./databases/mongo/mongooseConnection')
const PORT = process.env.PORT || 3456

mongooseConnection.connectMongoose()

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})