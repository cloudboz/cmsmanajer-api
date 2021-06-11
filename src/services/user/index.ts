import { SystemUserData, ServerConfig } from "../../types";

// npm modules
import fs from 'fs-extra';
import path from 'path';
import Git from "../git";
import ScriptService from "../script";

class SystemUserService {
  data?: SystemUserData
  baseDir = null
  script = new ScriptService()

  constructor(systemUser?: SystemUserData) {
    if (systemUser) {
      this.setData(systemUser);
      // this.systemUserlyConfig(systemUser);  
    }
  }

  public setData = (systemUser: SystemUserData) => {
    if (systemUser) {
      this.data = systemUser;
      this.applyConfig(systemUser);
    }
  }

  private applyConfig = (systemUser: SystemUserData) => {
    if (systemUser) {
      this.script.setConfig({ data: systemUser })
    }
  }

  public getBaseDirectory = (id?: string, additionalPath?: string): string => {
    id = id || this.data?.user.id;

    let baseDirectory = path.resolve(__dirname, '../../../../scripts/' + id);
    if (additionalPath) baseDirectory += additionalPath;

    return baseDirectory;
  };

  public create = async (data?: SystemUserData): Promise<string> => {
    try {
      const systemUser = data || this.data;
      this.baseDir = this.getBaseDirectory(systemUser.user.id)

      const { username, password } = systemUser

      // generate base script then run
      this.script.copy()
                  .setIP(systemUser.server.ip)
                  .setGroupVars({ 
                    ansible: {
                      username,
                    },
                    user: {
                      username,
                      password
                    } 
                  })
                  // .run("create-system-user")

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }
}

export default SystemUserService;