const express = require('express')
const route = require('./routes')
const path = require('path')
const cookieParser = require('cookie-parser')
const app = express()

app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules', 'bootstrap')))
app.use(cookieParser())
app.use(route)

module.exports = app
