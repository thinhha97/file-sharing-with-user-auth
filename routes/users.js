const bcrypt = require('bcrypt')
const router = require('express').Router()
const User = require('../models/user')

const nodeMailerTransporter = require('../utils/nodemailer/transporter')

router.get('/', (req, res) => {
  res.status(200).json({ message: 'user route' })
})

router.get('/register', (req, res) => {
  res.render('register')
})

router.post('/register', async (req, res) => {
  const { email, password, password2 } = req.body
  let errors = []

  if (!email || !password || !password2) {
    errors.push({ msg: 'Please fill all fields.' })
  }
  const user = await User.findOne({ email: email })

  if (user) {
    errors.push({ msg: 'Email exited.' })
    res.render('register', { errors, email, password, password2 })
    return
  }
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' })
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' })
  }
  if (errors.length > 0) {
    res.render('register', {
      errors,
      email,
      password,
      password2,
    })
  } else {
    const salt = await bcrypt.genSalt(12)
    const hashedPasswword = await bcrypt.hash(password, salt)
    const newUser = new User({
      email,
      password: hashedPasswword,
    })
    await newUser.save()
    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: `${email}`,
      subject: 'File sharing account activation needed',
      html: `<h4>Hi.</h4><br/>I am Thinh Ha at <a href="${req.protocol}://${req.headers.host}">FileSharing</a><br/>
      <h4>Please click below button to verify your FileSharing account</h4><br/>
      <a href="${req.protocol}://${req.headers.host}/users/verify/${newUser._id}"><button style="background-color: green; border: 0.2rem solid black; border-radius: 3%;">Verify Account</button></a>
      <p>if above button does not work. please copy and paste link below to your browser's address bar.</p><br/>
      <p>${req.protocol}://${req.headers.host}/users/verify/${newUser._id}</p>`,
    }
    nodeMailerTransporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        console.error(`Error sending mail` + err)
      }
    })
    const message = 'Your account has been created. Please check your email for verify instruction.'
    res.render('verify', {message})
  }
})

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  let errors = []
  const user = await User.findOne({ email })
  if (!user) {
    errors.push({ msg: 'email does not exist' })
    res.render('login', { errors, email, password })
    return
  }
  if (!(await bcrypt.compare(password, user.password))) {
    errors.push({ msg: 'wrong password' })
    res.render('login', { errors, email, password })
    return
  }
  if (!user.verified) {
    errors.push({
      msg: 'please check your email for verification instruction.',
    })
    res.render('login', { errors, email, password })
    return
  }
})

router.get('/verify/:id', async (req, res) => {
  const id = req.params.id
  const user = await User.findById(id)
  let message
  if (!user) {
    message = 'User not found'
    res.render('verify', { message })
    return
  } else {
    user.verified = true
    await user.save()
    message = 'Your account has been successfully activated.'
    res.render('verify', { message })
    return
  }
})

module.exports = router
