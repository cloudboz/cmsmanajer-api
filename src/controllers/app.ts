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
    header: {
      Authorization: "Bearer " + BACKEND_ACCESS_TOKEN,
    },
  });

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get("/apps", this.getApps);
    this.router.get("/apps/:id", this.getApp);
    this.router.get("/apps/:id/databases", this.getDatabasesByApp);
    this.router.post("/apps", this.createApp);
    this.router.post("/apps/:id", this.updateApp);
  }

  public getApps = async (req: Request, res: Response) => {
    try {
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
      const { data } = await this.backend.get({
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
    let body = {}
    data.user = req.user
    data.init = false
    
    try {

      const { data: { total: exist } } = await this.backend.find({
        tableName: 'apps',
        query: {
          name: data.name
        }
      })

      if(exist) return res.status(403).json({ message: "app name must be unique" })

      const { data: server } = await this.backend.get({
        tableName: "servers",
        id: data.server.id
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
            serverId: data.server.id,
            userId: data.user.id
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
       * check if web server or mysql haven't installed before install lamp or lemp
       * then generate root password for mysql
       */
      if(data.type == "lamp" || data.type == "lemp"){
        if(data.type == "lamp" && (!server.apache || !server.mysql)) {
          data.init = true
          body = {
            apache: true
          }
        }

        else if(data.type == "lemp" && (!server.nginx || !server.mysql)) {
          data.init = true
          body = {
            nginx: true
          }
        }

        if(!server.mysql) {
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
          body = {
            ...body,
            mysql: true
          }
        } else {
          const { data: { data: root } } = await this.backend.find({
            tableName: 'databases',
            query: {
              username: 'root',
              serverId: data.server.id,
            }
          })

          data.server.dbRootPass = root[0].password
        }
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
          systemuserId: data.systemUser.id,
          userId: data.user.id
        }
      })

      data.id = createdApp.id

      const app = new AppService(data)
      await app.create()

      if(app.apps.includes(data.type)) {
        body = {
          [data.type]: true
        }
      }

      await this.backend.patch({
        tableName: 'servers',
        id: data.server.id,
        body
      })

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed create project ", e);
      // await this.backend.remove({ tableName: 'project', id: data.id })
      return res.status(500).json({ message: "Failed to create project", e });
    }
  };

  public updateApp = async (req: Request, res: Response) => {
    try {
      await this.backend.patch({
        tableName: 'apps',
        id: req.params.id,
        body: req.body
      })

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed update app ", e);
      return res.status(500).json({ message: "Failed to update app" });
    }
  };

  // ----------------

  public getDatabasesByApp = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
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