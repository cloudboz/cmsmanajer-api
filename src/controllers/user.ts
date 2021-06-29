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
          email: querystring.escape(data.email)
        }
      })

      if(exist) return res.status(403).json({ message: "user already exist" })

      const { data: createdUser } = await this.backend.create({
        tableName: "users",
        body: data
      })

      data.id = createdUser.id

      const { data: user } = await this.backend.create({
        tableName: "authentication",
        body: {
          strategy: "local",
          ...data
        }
      })

      const auth = new AuthService(data)
      await auth.register()

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
        return res.status(500).json({ message: "Invalid login." });
      }
    } catch (e) {
      console.log("Failed to login ", e);
      return res.status(500).json({ message: e });
    }
  };

  public verifyEmail  = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: 'Bearer ' + BACKEND_ACCESS_TOKEN,
      })

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

  public createSysUser = async (req: Request, res: Response) => {
    const data = req.body

    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

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
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

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