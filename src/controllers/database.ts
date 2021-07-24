import * as express from 'express'
import { paramCase } from "param-case";

// types
import { Request, Controller, DatabaseData } from '../types'
import { Response } from 'express'


// services
import { BackendService, DatabaseService } from '../services'

// config
import { BACKEND_ACCESS_TOKEN } from "../../config/global.json";

class DatabaseController implements Controller {
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
    this.router.get("/databases", this.getDatabases);
    this.router.get("/databases/:id", this.getDatabase);
    this.router.post("/databases", this.createDatabase);
    this.router.delete("/databases/:id", this.deleteDatabase);
  }

  public getDatabases = async (req: Request, res: Response) => {
    try {
      const { data } = await this.backend.find({
        tableName: 'databases',
        query: {
          userId: req.user.id
        }
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get databases ", e);
      return res.status(500).json({ message: "Failed to get databases" });
    }
  };

  public getDatabase = async (req: Request, res: Response) => {
    try {
      const { data } = await this.backend.get({
        tableName: 'databases',
        id: req.params.id
      })

      return res.status(200).json({ message: "success", data })
    } catch (e) {
      console.log("Failed get database ", e);
      return res.status(500).json({ message: "Failed to get database" });
    }
  };

  /**
   * create database with username and password from user
   */
  public createDatabase = async (req: Request, res: Response) => {
    const data: DatabaseData = req.body
    data.name = paramCase(req.body.name)
    data.user = req.user
    
    try {
      const { data: { total: exist } } = await this.backend.find({
        tableName: 'databases',
        query: {
          name: data.name,
          serverId: data.app.server.id
        }
      })

      if(exist) return res.status(403).json({ message: "database name must be unique" })


      // store data to database
      const { data: createdDatabase } = await this.backend.create({
        tableName: 'databases',
        body: {
          ...data,
          appId: data.app.id,
          serverId: data.app.server.id,
          userId: data.user.id,
          status: "loading"
        }
      })

      data.id = createdDatabase.id

      const database = new DatabaseService(data, req.io)
      database.create()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed create database ", e);
      this.backend.remove({
        tableName: 'databases',
        id: data.id
      })
      return res.status(500).json({ message: "Failed to create database" });
    }
  };

  public deleteDatabase = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
      await this.backend.patch({
        tableName: 'databases',
        id,
        body: {
          status: "loading"
        }
      })

      const { data: db } = await this.backend.get({
        tableName: 'databases',
        id: id
      })

      const { data: app } = await this.backend.get({
        tableName: 'apps',
        id: db.appId
      })

      db.app = app
      db.user = req.user

      const database = new DatabaseService(db, req.io)
      await database.delete()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed delete database ", e);
      return res.status(500).json({ message: "Failed to delete database" });
    }
  };

}

export default DatabaseController;