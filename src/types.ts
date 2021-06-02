import { IRouter, Request } from 'express'

// controller
export interface Controller {
  name?: string
  router: IRouter
  initRoutes(): any
}

// user
export interface UserData {
  id?: string
  email: string
  password?: string
}

export interface RegisterData extends UserData {
  name: string
}

// server
export interface IServer {
  name: string
  ip?: string
}
export interface ServerData extends IServer {
  username: string
  password: string
  email?: string
  sshKey?: string
}

export interface ServerConfig {
  name: string
  ip: string
  username: string
  password: string
  sshKey?: string
}

// app
export interface AppData {
  name: string
  type: string
  server: IServer
  email?: string
}

// module
export interface IModule {
  server: ServerData
  setServer: (server: ServerData, name?: string) => void
}

// git
export interface IGit {
  init: () => void
  remote?: (url: string) => void
  commit?: (message: string) => void
  push?: (branch: string) => void
}

export interface IRegister {
  id?: string
  email: string
  password: string
  name: string
  country?: string
  province?: string
  job?: string
}

export interface ILogin {
  email: string
  password: string
}