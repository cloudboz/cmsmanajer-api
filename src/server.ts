import App from './app'
import express from 'express'
import cors from 'cors';

// Middleware
import authentication from './middlewares/authentication'

// Controllers
import { 
  ServerController,
  AppController,
  UserController,
  DatabaseController
} from './controllers'

const app = new App({
  port: 5000,
  controllers: [
    new ServerController(),
    new AppController(),
    new UserController(),
    new DatabaseController()
  ],
  plugins: [],
  middleWares: [
    express.json({ limit: '50mb' }),
    express.urlencoded({ extended: true }),
    express.static('public'),
    cors(),
    authentication
  ]
})

app.listen()