const router = require('express').Router()

router.get('/', (req, res) => {
  let input = {message: 'Please enter your email to reset password'}
  res.render('password-reset', { input })
})

router.use('/users', require('./users'))

module.exports = router
