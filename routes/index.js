const router = require('express').Router()


router.get('/', (req,res) => {
  res.status(200).json({message: 'hi'})
})

router.use('/users', require('./users'))

module.exports = router