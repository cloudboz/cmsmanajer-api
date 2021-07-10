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
      lamp: {
        full: "lamp-full-install",
        single: "lamp-create-single-app"
      },
      lemp: {
        full: "lemp-full-install",
        single: "lemp-create-single-app"
      }
    },
    delete: {
      lamp: {
        full: "lamp-full-uninstall",
        single: "lamp-delete-single-app"
      },
      lemp: {
        full: "lemp-full-uninstall",
        single: "lemp-delete-single-app"
      }
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

      const { username, password, sshKey } = app.systemUser
      const { title, username: wpUser, password: wpPass, email } = app.wordpress || {}
      
      const sysUser = {
        username,
        password,
        sshKey
      }

      let tag = null
      if(this.apps.includes(app.type)) tag = app.type + "-install"
      else tag = this.tags.create[app.type][app.init ? "full" : "single"]

      if(app.wordpress) tag = "wp-" + tag

      // generate base script then run
      this.script.copy()
                  .setIP(app.server.ip)
                  .setGroupVars({
                    ansible: sysUser,
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
}

export default AppService;