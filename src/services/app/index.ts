import { AppData, ServerConfig } from "../../types";

// npm modules
import fs from 'fs-extra';
import path from 'path';
import Git from "../git";
import ScriptService from "../script";

class AppService {
  data?: AppData
  baseDir = null
  git = new Git()
  script = new ScriptService()

  constructor(app: AppData) {
    if (app) {
      this.setData(app);
      // this.applyConfig(app);  
    }
  }

  public setData = (app: AppData) => {
    if (app) {
      this.data = app;
      this.applyConfig(app);
    }
  }

  private applyConfig = (app: AppData) => {
    if (app) {
      this.git.setConfig({ data: app, type: "app" })
      this.script.setConfig({ data: app, type: "app" })
    }
  }

  public getBaseDirectory = (email?: string, additionalPath?: string): string => {
    email = email || this.data?.email;

    let baseDirectory = path.resolve(__dirname, '../../../../scripts/' + email);
    if (additionalPath) baseDirectory += additionalPath;

    return baseDirectory;
  };

  public create = async (data?: AppData): Promise<string> => {
    try {
      const app = data || this.data;
      this.baseDir = this.getBaseDirectory(app.email)

      // take server config
      const tag = app.server.name.replace(/[\W_]+/g, "")      
      this.git.use(tag)
      const server: ServerConfig = JSON.parse((fs.readFileSync(this.baseDir + '/config.json')).toString())
      
      // generate base script then run
      this.script.copy()
                 .setIP(server.ip)
                 .setVars(server)
                //  .run(app.type)

      this.git.rm()

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }
}

export default AppService;