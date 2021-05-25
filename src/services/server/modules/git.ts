import { LocalGit, ServerData } from "../../../types";

import path from 'path';
import fs from 'fs';
import cp from 'child_process';

class Git implements LocalGit {
  server: ServerData = null
  baseDir: string = null

  constructor(server?: ServerData) {
    if(server)
      this.setServer(server)
  }

  public setServer = (server: ServerData) => {
    this.server = server
    this.baseDir = path.resolve(__dirname, '../../../../../scripts/' + server.email)
  }

  public init = () => {
    cp.execSync("git init", {
      cwd: this.baseDir,
    })

    console.log(`git initiated in user ${this.server.email}`)
  }

  public remote = (url: string) => {
    cp.execSync(`git remote add origin ${url}`, {
      cwd: this.baseDir,
    })
  }

  public commit = (message: string) => {
    cp.execSync(`git add . && git commit -m '${message}'`, {
      cwd: this.baseDir,
    })
  }

  public push = (branch: string) => {
    cp.execSync(`git push origin ${branch}`, {
      cwd: this.baseDir,
    })
  }

}

export default Git;