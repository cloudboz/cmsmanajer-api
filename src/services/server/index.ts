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
      // this.setRegistry(server.servers?.[0].serverProvider.name || "SHARED")
      this.applyConfig(server);
    }
  }

  private applyConfig = (server: ServerData) => {
    if (server) {
      this.git.setConfig({ data: server, type: "server" })
      this.script.setConfig({ data: server, type: "server" })
      // this.modules.git.setServer(server)
      // this.modules.git.gitea.setProject(project)
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
      const { ip, username, password } = server
      this.baseDir = this.getBaseDirectory(server.email)

      // generate base script
      this.script.copy()
                 .setIP(server.ip)
                 .setVars(server)

      // create version
      // this.git.commit(server.name)

//       this.run()

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }

  public run = () => cp.execSync('ansible-playbook main.yml', {
    cwd: this.baseDir + '/optimiz'
  })

}

export default ServerService;