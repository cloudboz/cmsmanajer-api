import { ServerData } from "../../types";

// npm modules
import fs from 'fs-extra';
import cp from 'child_process';
import path from 'path';
import Git from "../git";
import ScriptService from "../script";

class ServerService {
  data?: ServerData
  baseDir = null
  git = new Git()
  script = new ScriptService()

  constructor(server: ServerData) {
    if (server) {
      this.setData(server);
      // this.applyConfig(server);  
    }
  }

  public setData = (server: ServerData) => {
    if (server) {
      this.data = server;
      this.applyConfig(server);
    }
  }

  private applyConfig = (server: ServerData) => {
    if (server) {
      this.git.setConfig({ data: server, type: "server" })
      this.script.setConfig({ data: server, type: "server" })
    }
  }

  public getBaseDirectory = (email?: string, additionalPath?: string): string => {
    email = email || this.data?.email;

    let baseDirectory = path.resolve(__dirname, '../../../../scripts/' + email);
    if (additionalPath) baseDirectory += additionalPath;

    return baseDirectory;
  };

  public connect = async (data?: ServerData): Promise<string> => {
    try {
      const server = data || this.data;
      this.baseDir = this.getBaseDirectory(server.email)

      const config = {
        name: server.name,
        ip: server.ip,
        username: server.username,
        password: server.password
      }
      
      fs.writeFileSync(this.baseDir + '/config.json', JSON.stringify(config, null, 2))
      
      this.git.commit(server.name)
              .tag(server.name.replace(/[\W_]+/g, ""))
      
      // generate base script then run
      this.script.copy()
                 .setIP(server.ip)
                 .setVars(server)
                //  .run('main')

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }
}

export default ServerService;