import * as express from 'express'
import Joi from 'joi';

// types
import { Controller, ILogin, IRegister } from '../types'
import { Request, Response } from 'express'


// services
import { BackendService, AuthService } from '../services'

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
    this.router.post("/register", this.register);
    this.router.post("/login", this.login);
  }

  public register = async (req: Request, res: Response) => {
    const data: IRegister = req.body

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
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
          email: data.email
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

      // const auth = new AuthService(req.body)
      // await auth.register()

      return res.status(200).json({ message: "success", user })
    } catch (e) {
      console.log("Failed to register ", e);
      await this.backend.remove({
        tableName: "users",
        id: data.id
      })
      return res.status(500).json({ message: e.response.data.message });
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

      const { data: user } = await this.backend.create({
        tableName: "authentication",
        body: {
          strategy: "local",
          ...data
        }
      })

      return res.status(200).json({ message: "success", user })
    } catch (e) {
      console.log("Failed to login ", e);
      return res.status(500).json({ message: e });
    }
  };

}

export default UserController;