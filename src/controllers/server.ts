import * as express from 'express'

// types
import { Request, Controller, ServerData } from '../types'
import { Response } from 'express'


// services
import { BackendService, ServerService, DatabaseService } from '../services'

// config
import { BACKEND_ACCESS_TOKEN } from "../../config/global.json";

class ServerController implements Controller {
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
    this.router.get("/servers", this.getServers);
    this.router.get("/servers/:id", this.getServer);
    this.router.get("/servers/:id/apps", this.getAppsByServer);
    this.router.post("/servers", this.connectServer);
    this.router.delete("/servers/:id", this.deleteServer);
    this.router.delete("/servers/:id/database", this.uninstallDatabase);
  }

  public getServers = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: { data } } = await this.backend.find({
        tableName: 'servers',
        query: {
          userId: req.user.id
        }
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get servers ", e);
      return res.status(500).json({ message: "Failed to get servers" });
    }
  };

  public getServer = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: { data } } = await this.backend.get({
        tableName: 'servers',
        id: req.params.id
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get server ", e);
      return res.status(500).json({ message: "Failed to get server" });
    }
  };

  public getAppsByServer = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: { data } } = await this.backend.find({
        tableName: 'apps',
        query: {
          serverId: req.params.id
        }
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get apps ", e);
      return res.status(500).json({ message: "Failed to get apps" });
    }
  };

  public connectServer = async (req: Request, res: Response) => {
    const data: ServerData = req.body
    data.user = req.user
    
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: createdServer } = await this.backend.create({
        tableName: 'servers',
        body: {
          ...data,
          userId: data.user.id
        }
      })

      data.id = createdServer.id

      const { data: createdUser } = await this.backend.create({
        tableName: 'systemusers',
        body: {
          username: data.systemUser.username,
          serverId: data.id
        }
      })

      data.systemUser.id = createdUser.id

      const server = new ServerService(data)
      await server.connect()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed create project ", e);
      return res.status(500).json({ message: "Failed to create project" });
    }
  };

  public deleteServer = async (req: Request, res: Response) => {
    const data = req.params

    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: serverData } = await this.backend.get({
        tableName: 'servers',
        id: data.id
      })

      const server = new ServerService(serverData)
      await server.delete()

      await this.backend.remove({
        tableName: 'servers',
        id: data.id
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed create project ", e);
      return res.status(500).json({ message: "Failed to create project" });
    }
  };

  public uninstallDatabase = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: server } = await this.backend.get({
        tableName: 'servers',
        id
      })

      const db = {
        server,
        user: req.user
      }

      const database = new DatabaseService(db)
      await database.uninstall()

      // find and remove root password from database
      const { data: { data: root } } = await this.backend.find({
        tableName: 'databases',
        query: {
          username: "root"
        }
      })

      await this.backend.remove({
        tableName: 'databases',
        id: root[0].id
      })

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed uninstall database ", e);
      return res.status(500).json({ message: "Failed to uninstall database" });
    }
  
  }

}

export default ServerController;