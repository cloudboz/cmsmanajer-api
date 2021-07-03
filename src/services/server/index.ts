import { ServerData, SystemUserData } from "../../types";

// npm modules
import fs from 'fs-extra';
import cp from 'child_process';
import path from 'path';
import Git from "../git";
import ScriptService from "../script";

class ServerService {
  data?: ServerData
  baseDir = null
  script = new ScriptService()

  constructor(server?: ServerData) {
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
      this.script.setConfig({ data: server })
    }
  }

  public getBaseDirectory = (id?: string, additionalPath?: string): string => {
    id = id || this.data?.user.id;

    let baseDirectory = path.resolve(__dirname, '../../../../scripts/' + id);
    if (additionalPath) baseDirectory += additionalPath;

    return baseDirectory;
  };

  public connect = async (data?: ServerData): Promise<string> => {
    try {
      const server = data || this.data;
      this.baseDir = this.getBaseDirectory(server.user.id)
      
      // this.git.commit(server.id)
      //         .tag(server.id)
      
      const sysUser = {
        username: server.systemUser.username,
        password: server.systemUser.password,
        sshKey: server.sshKey?.name
      }

      // generate base script then run
      this.script.copy()
                 .setIP(server.ip)
                 .setGroupVars({ ansible: sysUser })
                //  .run('connect-server')

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
  }

  public createUser = async (data?: ServerData): Promise<string> => {
    try {
      const server = data || this.data;
      this.baseDir = this.getBaseDirectory(server.user.id)

      // generate base script
      this.script.copy()
                 .setIP(server.ip)
                //  .setGroupVars(server)

      // delete database
                //  .setVars()
                //  .run('main')

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }

  public delete = async (data?: ServerData): Promise<string> => {
    try {
      const server = data || this.data;
      this.baseDir = this.getBaseDirectory(server.user.id)

      // generate base script
      this.script.copy()
                 .setIP(server.ip)
                //  .setGroupVars(server)

      // delete database
                //  .setVars()
                //  .run('main')

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }
}

export default ServerService;