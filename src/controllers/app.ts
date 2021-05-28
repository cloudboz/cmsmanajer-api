import * as express from 'express'

// types
import { Controller } from '../types'
import { Request, Response } from 'express'


// services
import { BackendService, AppService } from '../services'

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
    this.router.post("/app", this.createApp);
  }

  public createApp = async (req: Request, res: Response) => {
    const data = req.body
    
    try {
      // const { data: createdProject } = await this.backend.create({ tableName: 'project', body: data })
      // data.id = createdProject.id

      const app = new AppService(req.body)
      await app.create()

      return res.status(200).json({ message: "success" })
    } catch (e) {
      console.log("Failed create project ", e);
      // await this.backend.remove({ tableName: 'project', id: data.id })
      return res.status(500).json({ message: "Failed to create project" });
    }
  };

}

export default AppController;