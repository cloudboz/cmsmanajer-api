import { ServerData } from "../../types";

// npm modules
import fs from 'fs-extra';
import path from 'path';
import Git from "./modules/git";

class ServerService {
  data?: ServerData
  modules = {
    git: new Git()
  }

  constructor(server: ServerData) {
    if (server) {
      this.setData(server);
      // this.applyConfigToModules(server);
    }
  }

  public setData = (server: ServerData) => {
    if (server) {
      this.data = server;
      // this.setRegistry(server.servers?.[0].serverProvider.name || "SHARED")
      this.applyConfigToModules(server);
    }
  }

  private applyConfigToModules = (server: ServerData) => {
    if (server) {
      // this.modules.git.local.setProject(project)
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
      const baseDir = this.getBaseDirectory(server.email)

      // change inventory
      fs.writeFileSync(baseDir + '/optimiz/inventory', server.ip)

      // change group_vars
      const vars = `
# ssh
ansible_connection: ssh
ansible_user: ${server.username}
ansible_ssh_pass: ${server.password}
ansible_sudo_pass: ${server.password}
ansible_ssh_private_key_file: files/sgnd.pem
ansible_python_interpreter: /usr/bin/python3

# users
pass_auth: PasswordAuthentication yes
pubkey_auth: PubkeyAuthentication yes
      `

      fs.writeFileSync(baseDir + '/optimiz/group_vars/all.yml', vars)

      // create version
      this.modules.git.commit(server.name)


      return Promise.resolve("Success");
    } catch (e) {
      return Promise.reject(e?.message);
    }
  }

}

export default ServerService;