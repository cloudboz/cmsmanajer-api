import App from './app'
import express from 'express'
import cors from 'cors';

// Middleware

// Controllers
import ServerController from './controllers/server'

const app = new App({
  port: 5000,
  controllers: [
    new ServerController()
  ],
  plugins: [],
  middleWares: [
    express.json({ limit: '50mb' }),
    express.urlencoded({ extended: true }),
    cors()
  ]
})

app.listen()