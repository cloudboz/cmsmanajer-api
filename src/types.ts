import { IRouter, Request as ERequest } from 'express'

export interface Request extends ERequest {
  user?: UserData
}
// controller
export interface Controller {
  name?: string
  router: IRouter
  initRoutes(): any
}

export interface Data {
  user?: UserData
}

// user
export interface UserData {
  id?: string
  email: string
  password?: string
}

export interface RegisterData extends UserData {
  name: string
  phone: string
}

export interface SSHKey extends Data {
  id?: string
  name: string
  key: string
}

// server
export interface ServerData extends Data {
  id?: string
  name?: string
  ip: string
  stack?: string
  sshKey?: SSHKey
  systemUser?: SystemUserData
  dbRootPass?: string
}

export interface ServerConfig {
  id: string
  username?: string
  password: string
  sshKey?: string
}

// app
export interface Wordpress {
  title?: string
  username?: string
  password?: string
  email?: string
}
export interface AppData extends Data {
  id?: string
  name: string
  type?: string
  domain?: string
  createUser?: boolean
  init?: Boolean
  server: ServerData
  systemUser?: SystemUserData
  username?: String
  password?: String
  wordpress?: Wordpress
}

export interface AppConfig {
  id: string
}

// database
export interface DatabaseData extends Data {
  id?: string
  name?: string
  username?: string
  password?: string
  appId?: string
  server: ServerData
}

export interface DatabaseConfig {
  id: string
  password: string
}

// sysuser
export interface SystemUserData extends Data {
  id?: string
  username?: string
  password?: string
  sshKeyId?: string
  server?: ServerData
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
  phone: string
  name: string
  country?: string
  province?: string
  job?: string
}

export interface ILogin {
  email: string
  password: string
}

interface AnsibleVars {
  ansible_user: string
  ansible_ssh_pass?: string
  ansible_sudo_pass?: string
  ansible_ssh_private_key_file?: string
}

interface WordpressVars {
  wordpress_home_url?: string
  wordpress_site_title?: string
  wordpress_admin_user?: string
  wordpress_admin_user_pass?: string
  wordpress_admin_email?: string
}

interface AppVars {
  app_username: string
  app_password: string
  app_database?: string
  app_domain: string
  app_config: string
}

interface UserVars {
  username: string
  password: string
}

interface MySQLRootVars {
  mysql_root_password: string
}
export interface GroupVars extends AnsibleVars, AppVars, UserVars, MySQLRootVars, WordpressVars {
  
}

export interface GroupVarsArgs {
  ansible: { username?: string, password?: string, sshKey?: string }
  user?: UserVars
  database?: { password: string }
  app?: { name: string, username?: string, password?: string, domain?: string }
  wordpress?: { title: string, username: string, password: string, email: string }
}

export interface SendgridOption {
  from?: string
  to: string
  subject: string
  html: string
}