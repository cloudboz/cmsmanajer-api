import path from 'path';
import fs from 'fs-extra';
import { RegisterData } from "../../types"
import Git from '../git';

class AuthService {
  data?: RegisterData = null
  baseDir? = null
  git = new Git()

  constructor(user) {
    if (user) {
      this.setData(user);
    }
  }

  public setData = (user: RegisterData) => {
    if (user) {
      this.data = user;
      this.applyConfig(user);
    }
  }

  private applyConfig = (user: RegisterData) => {
    if (user) {
      this.git.setConfig({ data: user, type: "user" })
    }
  }

  private createBaseDirectory = (user?: RegisterData): void => {
    const fullPath = path.resolve(__dirname, '../../../../scripts/' + user.email);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  }

  private createConfigFile = () => {
    fs.writeFileSync(`${this.baseDir}/.gitignore`, "")
  }

  /**
   * It will create a directory and init git when user register
   */
  public register = (data?: RegisterData) => {
    const user = data || this.data;

    this.createBaseDirectory(user);
    this.createConfigFile()

    this.git.init().commit("base")
  }
}

export default AuthService