import * as express from 'express'

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
    this.router.post("/databases", this.createDatabase);
    this.router.delete("/databases/:id", this.deleteDatabase);
  }

  public getDatabases = async (req: Request, res: Response) => {
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

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

  /**
   * create database with username and password from user
   */
  public createDatabase = async (req: Request, res: Response) => {
    const data: DatabaseData = req.body
    data.user = req.user
    
    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      
      // get mysql root password
      const { data: { data: dbs } } = await this.backend.find({
        tableName: 'databases',
        query: {
          username: 'root',
          serverId: data.server.id
        }
      })

      if(dbs.length) data.server.dbRootPass = dbs[0].password

      // store data to database
      const { data: createdDatabase } = await this.backend.create({
        tableName: 'databases',
        body: {
          ...data,
          rootPassword: data.server.dbRootPass
        }
      })

      data.id = createdDatabase.id

      const database = new DatabaseService(data)
      await database.create()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed create project ", e);
      return res.status(500).json({ message: "Failed to create project" });
    }
  };

  public deleteDatabase = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
      this.backend.setHeader({
        Authorization: req.headers.authorization
      })

      const { data: db } = await this.backend.get({
        tableName: 'databases',
        id: id
      })

      const { data: server } = await this.backend.get({
        tableName: 'servers',
        id: db.serverId
      })

      db.server = server

      // get mysql root password
      const { data: { data: root } } = await this.backend.find({
        tableName: 'databases',
        query: {
          username: 'root',
          serverId: db.serverId
        }
      })

      if(root.length) db.server.dbRootPass = root[0].password
      db.user = req.user

      const database = new DatabaseService(db)
      await database.delete()

      await this.backend.remove({
        tableName: 'databases',
        id: id
      })

      return res.status(200).json({ message: "success", db })
    } catch (e) {
      console.log("Failed create project ", e);
      return res.status(500).json({ message: "Failed to create project" });
    }
  };

}

export default DatabaseController;