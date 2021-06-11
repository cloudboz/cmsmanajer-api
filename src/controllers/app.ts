import * as express from 'express'

// types
import { Request, AppData, Controller } from '../types'
import { Response } from 'express'


// services
import { BackendService, AppService, SystemUserService, ScriptService } from '../services'

// config
import { BACKEND_ACCESS_TOKEN } from "../../config/global.json";

class AppController implements Controller {
  public path = "/";
  public router = express.Router();
  private backend = new BackendService({
    header: {}
  });

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get("/apps", this.getApps);
    this.router.get("/apps/:id", this.getApp);
    this.router.get("/apps/:id/databases", this.getDatabasesByApp);
    this.router.post("/apps", this.createApp);
  }

  public getApps = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: { data } } = await this.backend.find({
        tableName: 'apps',
        query: {
          userId: req.user.id
        }
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get apps ", e);
      return res.status(500).json({ message: "Failed to get apps" });
    }
  };

  public getApp = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: { data } } = await this.backend.get({
        tableName: 'apps',
        id: req.params.id
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get app ", e);
      return res.status(500).json({ message: "Failed to get app" });
    }
  };

  public createApp = async (req: Request, res: Response) => {
    const data: AppData = req.body
    data.user = req.user
    data.init = false
    
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      /*
       * create new system user
       * if user wants to create and use new system user
       */
      if(data.createUser) {
        const { data: createdUser } = await this.backend.create({
          tableName: 'systemusers',
          body: {
            username: data.systemUser.username,
            serverId: data.server.id
          }
        })

        data.systemUser.id = createdUser.id

        const su = {
          username: data.systemUser.username,
          password: data.systemUser.password,
          server: {
            ip: data.server.ip
          }
        }

        const systemUser = new SystemUserService(su)
        await systemUser.create()
      }

      /*
       * get mysql root password
       * generate one if it hasn't installed
       */
      const { data: { data: root } } = await this.backend.find({
        tableName: 'databases',
        query: {
          username: 'root',
          serverId: data.server.id
        }
      })


      if(root.length) data.server.dbRootPass = root[0].password
      else {
        const script = new ScriptService()
        data.server.dbRootPass = script.generatePassword()
        await this.backend.create({
          tableName: 'databases',
          body: {
            name: 'root_' + script.randomString(3),
            username: 'root',
            password: data.server.dbRootPass,
            serverId: data.server.id
          }
        })
        data.init = true
      }

      /*
       * store app data in database then
       * pass all data to app service
       */
      const { data: createdApp } = await this.backend.create({
        tableName: 'apps',
        body: {
          ...data,
          serverId: data.server.id,
          systemuserId: data.systemUser.id
        }
      })

      data.id = createdApp.id

      const app = new AppService(data)
      await app.create()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed create project ", e);
      // await this.backend.remove({ tableName: 'project', id: data.id })
      return res.status(500).json({ message: "Failed to create project", e });
    }
  };

  // ----------------

  public getDatabasesByApp = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: { data } } = await this.backend.find({
        tableName: 'databases',
        query: {
          appId: id
        }
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get databases ", e);
      return res.status(500).json({ message: "Failed to get databases" });
    }
  };

}

export default AppController;