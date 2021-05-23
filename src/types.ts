import { IRouter, Request } from 'express'

// controller
export interface Controller {
  name?: string
  router: IRouter
  initRoutes(): any
}