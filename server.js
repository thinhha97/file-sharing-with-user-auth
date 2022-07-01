const express = require('express')
const route = require('./routes')
const path = require('path')

const app = express()

app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(route)

module.exports = app
