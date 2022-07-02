const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const router = require('express').Router()
const User = require('../models/user')
const Token = require('../models/token')
const cookie =require('cookie')
const encryption = require('../utils/encryption')

const nodeMailerTransporter = require('../utils/nodemailer/transporter')

const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET

router.get('/', (req, res) => {
  res.status(200).json({ message: 'user route' })
})

router.get('/signup', (req, res) => {
  res.render('signup')
})

router.post('/signup', async (req, res) => {
  const { email, password, password2 } = req.body
  let errors = []

  if (!email || !password || !password2) {
    errors.push({ msg: 'Please fill all fields.' })
  }
  const user = await User.findOne({ email: email })

  if (user) {
    errors.push({ msg: 'Email exited.' })
    res.render('signup', { errors, email, password, password2 })
    return
  }
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' })
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' })
  }
  if (errors.length > 0) {
    res.render('signup', {
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
    const message =
      'Your account has been created. Please check your email for verify instruction.'
    res.render('signin', { errors: [{ msg: message }] })
  }
})

router.get('/signin', (req, res) => {
  res.render('signin')
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  let errors = []
  const user = await User.findOne({ email })
  if (!user) {
    errors.push({ msg: 'email does not exist' })
    res.render('signin', { errors, email, password })
    return
  }
  if (!(await bcrypt.compare(password, user.password))) {
    errors.push({ msg: 'wrong password' })
    res.render('signin', { errors, email, password })
    return
  }
  if (!user.verified) {
    errors.push({
      msg: 'please check your email for verification instruction.',
    })
    res.render('signin', { errors, email, password })
    return
  }

  const token = jwt.sign(user._id.toString(), JWT_TOKEN_SECRET)
  user.lastLogin = new Date()
  await user.save()

  res.setHeader('Set-Cookie', cookie.serialize('jwt', token, { path: '/'}))
  
  res.redirect('/')
})

router.get('/verify/:id', async (req, res) => {
  const id = req.params.id
  const user = await User.findById(id)
  let message
  if (!user) {
    message = `There's a problem verifying your account :(((`
    res.render('signin', { errors: [{ msg: message }] })
    return
  } else {
    user.verified = true
    await user.save()
    message =
      'Your account has been successfully activated. You can now log in.'
    res.render('signin', { errors: [{ msg: message }] })
    return
  }
})

router.get('/password-reset', (req, res) => {
  res.render('password-reset', {
    input: { message: 'Please enter your email to reset password.' },
  })
  return
})

router.post('/password-reset', async (req, res) => {
  const { email } = req.body
  if (!email) {
    res.render('password-reset', {
      input: { message: 'Please enter your email to reset password.' },
    })
    return
  }
  const user = await User.findOne({ email })

  if (!user) {
    res.render('password-reset', {
      errors: [{ msg: `Your email doesn't seem to have an account with us` }],
      input: {},
    })
    return
  }
  res.render('password-reset', {
    input: {
      message: `Please check your email for the password reset link.`,
      email,
    },
  })

  let token = await Token.findOne({ userId: user._id })

  if (!token) {
    token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
    })
    await token.save()
  }

  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: `${email}`,
    subject: 'Password reset for FileSharing account.',
    html: `<a href="${req.protocol}://${req.headers.host}"><h1>FileSharing</h1></a><br/>
    <h4>Someone (hopefully you) has requested a password reset for your FileSharing account. Follow the link below to set a new password:</h4><br/>
    <a href="${req.protocol}://${req.headers.host}/users/password-reset/${user._id}/${token.token}">${req.protocol}://${req.headers.host}/users/password-reset/${user._id}/${token.token}</a>
    <h4>If you don't wish to reset your password, disregard this email and no action will be taken.</h4><br/>
    <h4>The FileSharing Team</h4>
    ${req.protocol}://${req.headers.host}`,
  }
  nodeMailerTransporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.error(`Error sending mail` + err)
    }
  })
})

router.all('/password-reset/:id/:token', async (req, res) => {
  const { password, password2 } = req.body
  const { id, token } = req.params
  const user = await User.findById(id)
  const authToken = await Token.findOne({ userId: id, token })

  if (!user || !authToken) {
    res.render('password-reset', {
      errors: [
        {
          msg: `There's a problem resetting your password. Please contact support.`,
        },
      ],
      input: {},
    })
    return
  }
  if (!password && !password2) {
    res.render('password-reset', { input: { userId: user._id, token } })
    return
  } else {
    if (!password === password2) {
      res.render('password-reset', {
        input: { userId: user._id, token },
        errors: [{ msg: `Password do not match.` }],
      })
      return
    }
    if (password.length < 6) {
      res.render('password-reset', {
        input: { userId: user._id, token },
        errors: [{ msg: `Password must be more than 6 characters.` }],
      })
      return
    }
    const salt = await bcrypt.genSalt(12)
    const hashedPasswword = await bcrypt.hash(password, salt)
    user.password = hashedPasswword
    await user.save()
    await authToken.delete()
    res.render('signin', {
      errors: [{ msg: `Your password has been changed successfully.` }],
    })
  }
})

module.exports = router
