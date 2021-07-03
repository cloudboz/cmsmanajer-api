import * as express from 'express'
import Joi from 'joi';
import querystring from 'querystring';

// types
import { Request, Controller, ILogin, IRegister } from '../types'
import { Response } from 'express'


// services
import { BackendService, AuthService, SystemUserService } from '../services'

// config
import { BACKEND_ACCESS_TOKEN } from "../../config/global.json";

class UserController implements Controller {
  public path = "/";
  public router = express.Router();
  private backend = new BackendService({
    header: {
      Authorization: "Bearer " + BACKEND_ACCESS_TOKEN,
    },
  });

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get("/profile", this.getUserByToken)
    this.router.post("/register", this.register);
    this.router.post("/login", this.login);
    this.router.post("/verify", this.verifyEmail);
    this.router.post("/resend", this.resendEmail);
    this.router.post("/forgot-password", this.forgotPassword);
    this.router.post("/forgot-password/verify", this.verifyForgetPasswordToken);
    this.router.post("/forgot-password/resend", this.resendForgetPasswordEmail);
    this.router.post("/forgot-password/reset", this.resetPassword);
    this.router.post("/users", this.createSysUser)
  }

  public register = async (req: Request, res: Response) => {
    const data: IRegister = req.body

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      phone: Joi.string().min(6),
      name: Joi.string().min(3).required(),
      country: Joi.string().min(3),
      province: Joi.string().min(3),
      job: Joi.string().min(3),
    });

    const { error } = schema.validate(data);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
      const { data: { total: exist } } = await this.backend.find({
        tableName: "users",
        query: {
          or: [
            { email: querystring.escape(data.email) },
            { phone: querystring.escape(data.phone) }
          ]
        }
      })

      if(exist) return res.status(403).json({ message: "user or phone number already exist" })

      const { data: createdUser } = await this.backend.create({
        tableName: "users",
        body: data
      })

      data.id = createdUser.id

      const auth = new AuthService(data)
      await auth.register()

      const { data: user } = await this.backend.create({
        tableName: "authentication",
        body: {
          strategy: "local",
          email: data.email,
          password: data.password
        }
      })

      return res.status(200).json({ message: "success", data: user })
    } catch (e) {
      console.log("Failed to register ", e);
      await this.backend.remove({
        tableName: "users",
        id: data.id
      })
      return res.status(500).json({ message: e });
    }
  };

  public login = async (req: Request, res: Response) => {
    const data: ILogin = req.body

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required()
    });

    const { error } = schema.validate(data);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
      const { data: { total: exist } } = await this.backend.find({
        tableName: "users",
        query: {
          email: data.email
        }
      })

      if(!exist) return res.status(404).json({ message: "user not found" })

      try {
        const { data: user } = await this.backend.create({
          tableName: "authentication",
          body: {
            strategy: "local",
            ...data
          }
        })
        return res.status(200).json({ message: "success", data: user })
      } catch (error) {
        return res.status(400).json({ message: "Invalid login." });
      }
    } catch (e) {
      console.log("Failed to login ", e);
      return res.status(500).json({ message: e });
    }
  };

  //* ------------------------------- EMAIL VERIFICATION ------------------------------- *//

  public verifyEmail  = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      // get token
      const { data: { data } } = await this.backend.find({
        tableName: 'email-verifications',
        query: {
          token
        }
      })
      
      if(!data.length) return res.status(404).json({ message: "token is invalid" })

      // update user
      await this.backend.patch({
        tableName: 'users',
        id: data[0].userId,
        body: {
          verified: true
        }
      })

      // remove token
      await this.backend.remove({
        tableName: 'email-verifications',
        id: data[0].id
      })

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to verify email ", e);
      return res.status(500).json({ message: e });
    }
  }

  public resendEmail  = async (req: Request, res: Response) => {
    try {
      // const { token } = req.body
      const { id } = req.user

      const { data: user } = await this.backend.get({
        tableName: "users",
        id
      })

      const { data } = await this.backend.find({
        tableName: 'email-verifications',
        query: {
          email: user.email,
          sort: {
            createdAt: "-1"
          }
        }
      })

      if(data.total){
        const verifData = data.data[0]
        const date = Date.parse(verifData.createdAt)
        const now = new Date().getTime()
        if((now - date) < 60000) return res.status(400).json({ message: "wait 60 seconds before resend email" })
      }
      
      const auth = new AuthService(user)
      await auth.resend()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to verify email ", e);
      return res.status(500).json({ message: e });
    }
  }

  //* ------------------------------- FORGOT PASSWORD ------------------------------- *//

  public forgotPassword  = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      // get token
      const { data: { data } } = await this.backend.find({
        tableName: 'users',
        query: {
          email: querystring.escape(email)
        }
      })
      
      if(!data.length) return res.status(404).json({ message: "user not found" })

      const auth = new AuthService(data[0])
      await auth.forgetPassword()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to send reset password instruction ", e);
      return res.status(500).json({ message: e });
    }
  }

  public resendForgetPasswordEmail  = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      const { data: users } = await this.backend.find({
        tableName: "users",
        query: {
          email
        }
      })

      if(!users.total) return res.status(404).json({ message: "user not found" })

      const user = users.data[0]

      const { data } = await this.backend.find({
        tableName: 'forgot-passwords',
        query: {
          email: email,
          sort: {
            createdAt: "-1"
          }
        }
      })

      if(data.total){
        const verifData = data.data[0]
        const date = Date.parse(verifData.createdAt)
        const now = new Date().getTime()
        if((now - date) < 60000) return res.status(400).json({ message: "wait 60 seconds before resend email" })
      }
      
      const auth = new AuthService(user)
      await auth.forgetPassword()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to verify email ", e);
      return res.status(500).json({ message: e });
    }
  }

  public verifyForgetPasswordToken  = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      // get token
      const { data: { data } } = await this.backend.find({
        tableName: 'forgot-passwords',
        query: {
          token
        }
      })
      
      if(!data.length) return res.status(404).json({ message: "token is invalid" })

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to verify email ", e);
      return res.status(500).json({ message: e });
    }
  }

  public resetPassword  = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body

      // get token
      const { data: { data } } = await this.backend.find({
        tableName: 'forgot-passwords',
        query: {
          token
        }
      })
      
      if(!data.length) return res.status(403).json({ message: "token is invalid" })

      // update password
      await this.backend.patch({
        tableName: 'users',
        id: data[0].userId,
        body: {
          password
        }
      })

      // remove token
      await this.backend.remove({
        tableName: 'forgot-passwords',
        id: data[0].id
      })

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to verify email ", e);
      return res.status(500).json({ message: e });
    }
  }

  public createSysUser = async (req: Request, res: Response) => {
    const data = req.body

    try {
      await this.backend.create({
        tableName: "systemusers",
        body: {
          username: data.username,
          serverId: data.server.id
        }
      })

      data.user = req.user

      const sysUser = new SystemUserService(data)
      await sysUser.create()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed to login ", e);
      return res.status(500).json({ message: e });
    }
  };

  public getUserByToken = async (req: Request, res: Response) => {
    try {
      const { data } = await this.backend.get({
        tableName: "users",
        id: req.user.id
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed to login ", e);
      return res.status(500).json({ message: e });
    }
  };

}

export default UserController;