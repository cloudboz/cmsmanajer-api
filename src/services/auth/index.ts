import path from 'path';
import fs from 'fs-extra';
import { RegisterData } from "../../types"
import Git from '../git';
import Sendgrid from '../email/sendgrid';
import EmailService from '../email';

class AuthService {
  data?: RegisterData = null
  baseDir? = null
  email = new EmailService(null)

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
      this.email.setData(user)
    }
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
      await this.email.sendVerificationEmail()
      return Promise.resolve("success")
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
    }
  }

  public resend = async (data?: RegisterData) => {
    try {
      await this.email.sendVerificationEmail()
      return Promise.resolve("success")
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
    }
  }

  public forgetPassword = async (data?: RegisterData) => {
    try {
      await this.email.sendForgetPassword()
      return Promise.resolve("success")
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
    }
  }
}

export default AuthService