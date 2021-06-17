import path from 'path';
import fs from 'fs-extra';
import { RegisterData } from "../../types"
import Git from '../git';
import Sendgrid from '../email/sendgrid';
import EmailService from '../email';

class AuthService {
  data?: RegisterData = null
  baseDir? = null

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
    if (user) {}
  }

  private createBaseDirectory = (user?: RegisterData): void => {
    const fullPath = path.resolve(__dirname, '../../../../scripts/' + user.id);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
    this.baseDir = fullPath
  }

  private createConfigFile = () => {
    const ignore = 
`optimiz/
core/
cleanup/
databs/`
    fs.writeFileSync(`${this.baseDir}/.gitignore`, ignore)
  }

  /**
   * It will create a directory and init git when user register
   */
  public register = async (data?: RegisterData) => {
    const user = data || this.data;

    this.createBaseDirectory(user);
    // this.createConfigFile()
    try {
      const email = new EmailService(user)
      await email.sendVerificationEmail()
      return Promise.resolve("success")
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
    }

  }

  public verifyEmail = async () => {

  }
}

export default AuthService