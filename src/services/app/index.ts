import { AppConfig, AppData, ServerConfig, SystemUserData } from "../../types";

// npm modules
import fs from 'fs-extra';
import path from 'path';
import Git from "../git";
import ScriptService from "../script";
import { paramCase } from "param-case";

class AppService {
  data?: AppData
  baseDir = null
  script = new ScriptService()
  apps = ["apache", "nginx", "mysql", "mongodb", "docker"]
  tags = {
    create: {
      full: "full-install",
      single: "create-single-app",
    },
    delete: {
      full: "full-uninstall",
      single: "delete-single-app",
    }
  }

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
      this.script.setConfig({ data: app })
    }
  }

  public getBaseDirectory = (id?: string, additionalPath?: string): string => {
    id = id || this.data?.user.id;

    let baseDirectory = path.resolve(__dirname, '../../../../scripts/' + id);
    if (additionalPath) baseDirectory += additionalPath;

    return baseDirectory;
  };

  public create = async (data?: AppData): Promise<string> => {
    try {
      const app = data || this.data;
      this.baseDir = this.getBaseDirectory(app.user.id)

      const { title, username: wpUser, password: wpPass, email } = app.wordpress || {}

      let tag = null
      if(this.apps.includes(app.type)) tag = app.type + "-install"
      else tag = app.type + '-' + this.tags.create[app.init ? "full" : "single"]

      // generate base script then run
      this.script.copy()
                  .setIP(app.server.ip)
                  .setGroupVars({
                    ansible: app.systemUser,
                    app: {
                      name: app.name,
                      domain: app.domain,
                    },
                    wordpress: {
                      title,
                      username: wpUser,
                      password: wpPass,
                      email
                    },
                    database: {
                      password: app.server.dbRootPass
                    }
                  })
                  // .run(tag)

                  console.log(tag);
                
      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }

  public delete = async (data?: AppData): Promise<string> => {
    try {
      const app = data || this.data;
      this.baseDir = this.getBaseDirectory(app.user.id)

      let tag = null
      if(this.apps.includes(app.type)) tag = app.type + "-uninstall"
      else tag = app.type + '-' + this.tags.create[app.init ? "full" : "single"]

      // generate base script
      this.script.copy()
                 .setIP(app.server.ip)
                 .setGroupVars({
                    ansible: app.systemUser,
                    app: {
                      name: app.name,
                      domain: app.domain,
                    }
                  })
                console.log(tag);

      // delete database
                //  .setVars()
                //  .run('main')

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
  }
  
}

export default AppService;