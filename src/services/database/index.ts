import { DatabaseData, ServerConfig } from "../../types";

// npm modules
import fs from 'fs-extra';
import path from 'path';
import Git from "../git";
import ScriptService from "../script";

class DatabaseService {
  data?: DatabaseData
  baseDir = null
  script = new ScriptService()

  constructor(database: DatabaseData) {
    if (database) {
      this.setData(database);
      // this.databaselyConfig(database);  
    }
  }

  public setData = (database: DatabaseData) => {
    if (database) {
      this.data = database;
      this.applyConfig(database);
    }
  }

  private applyConfig = (database: DatabaseData) => {
    if (database) {
      this.script.setConfig({ data: database })
    }
  }

  public getBaseDirectory = (id?: string, additionalPath?: string): string => {
    id = id || this.data?.user.id;

    let baseDirectory = path.resolve(__dirname, '../../../../scripts/' + id);
    if (additionalPath) baseDirectory += additionalPath;

    return baseDirectory;
  };

  public create = async (data?: DatabaseData): Promise<string> => {
    try {
      const database = data || this.data;
      this.baseDir = this.getBaseDirectory(database.user.id)

      const { name, username, password, server } = database


      // generate base script then run
      this.script.copy()
                  .setIP(server.ip)
                  .setGroupVars({
                    ansible: {
                      username: "ubuntu"
                    },
                    app: {
                      name,
                      username,
                      password
                    },
                    database: {
                      password: server.dbRootPass
                    }
                  })
                //  .run("mysql-create-single-db")

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
    
  }

  /**
   * delete single database
   * 
   */
  public delete = async (data?: DatabaseData): Promise<string> => {
    try {
      const database = data || this.data;
      this.baseDir = this.getBaseDirectory(database.user.id)

      const { server, name, username, password } = database

      // generate base script then run
      this.script.copy()
                  .setIP(server.ip)
                  .setGroupVars({
                    ansible: {},
                    app: {
                      name,
                      username,
                      password
                    },
                    database: {
                      password: server.dbRootPass
                    }
                  })
                //  .run("mysql-delete-single-db")

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
  } 

  public uninstall = async (data?): Promise<string> => {
    try {
      const database = data || this.data;
      this.baseDir = this.getBaseDirectory(database.user.id)

      // generate base script then run
      this.script.copy()
                  .setIP(database.server.ip)
                //  .run("mysql-uninstall")

      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
  } 
}

export default DatabaseService;