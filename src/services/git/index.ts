import { ServerData } from "../../types";

import path from 'path';
import fs from 'fs';
import cp from 'child_process';

class Git {
  data = null
  baseDir: string = null
  folder = {
    server: "/optimiz",
    app: "/core"
  }

  constructor(config?) {
    if(config)
      this.setConfig(config)
  }

  public setConfig = ({ data, type }) => {
    this.data = data
    this.baseDir = path.resolve(__dirname, '../../../../scripts/' + data.email)
  }

  public init = () => {
    cp.execSync("git init", {
      cwd: this.baseDir,
    })

    const configGit = 
`# exclude scripts directory
optimiz/
core/`
    fs.writeFileSync(`${this.baseDir}/.gitignore`, configGit)

    console.log(`git initiated in user ${this.data.email}`)

    return this;
  }

  public commit = (message: string) => {
    cp.execSync(`git add config.json && git commit -m '${message}'`, {
      cwd: this.baseDir,
    })

    return this;
  }

  public tag = (name: string) => {
    cp.execSync(`git tag ${name}`, {
      cwd: this.baseDir,
    })
  }

  public use = (tag: string) => {
    cp.execSync(`git checkout -b deploy ${tag}`, {
      cwd: this.baseDir,
    })
  }

  public rm = () => {
    cp.execSync(`git checkout -f master && git branch -D deploy`, {
      cwd: this.baseDir,
    })
  }

  public delete = () => {
    cp.execSync("rm -rf .git", {
      cwd: this.baseDir,
    })
  }

}

export default Git;