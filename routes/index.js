const router = require('express').Router()
const authenticateToken = require('../middlewares/authenticateToken')

router.get('/', authenticateToken, (req, res) => {
  res.render('index')
})

router.use('/users', require('./users'))

module.exports = router
