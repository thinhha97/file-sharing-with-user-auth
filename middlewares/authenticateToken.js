const jwt = require('jsonwebtoken')
const User = require('../models/user')

const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET

module.exports = (req, res, next) => {
  const token = req.cookies['jwt']
  if (!token) {
    res.render('signin')
    return
  }
  jwt.verify(token, JWT_TOKEN_SECRET, async (err, data) => {
    if (err) {
      res.render('signin')
      return
    }
    const user = await User.findById(data)
    if (!user) {
      res.render('signin', { errors: [{ msg: `User does not exist.` }] })
      return
    }
    req.user = user
    next()
  })
}
