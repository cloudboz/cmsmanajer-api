import App from './app'
import express from 'express'
import cors from 'cors';

// Middleware
import authentication from './middlewares/authentication'

// Controllers
import { 
  ServerController,
  AppController,
  UserController
} from './controllers'

const app = new App({
  port: 5000,
  controllers: [
    new ServerController(),
    new AppController(),
    new UserController()
  ],
  plugins: [],
  middleWares: [
    express.json({ limit: '50mb' }),
    express.urlencoded({ extended: true }),
    cors(),
    authentication
  ]
})

app.listen()