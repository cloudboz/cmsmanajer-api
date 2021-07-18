import fs from 'fs-extra';
import cp from 'child_process';
import path from 'path';
import crypto from 'crypto';
import yaml, { parse } from 'yaml';

import { Options, GroupVars, GroupVarsArgs } from '../../types';
import { paramCase } from "param-case";
import execAsync from '../../utils/execAsync';

class ScriptService {
  baseDir: string = null
  userDir: string = null
  id: string = null
  io? = null

  constructor(config?) {
    if(config)
      this.setConfig(config)
  }

  /**
   * setConfig
   */
  public setConfig({ data }) {
    this.baseDir = path.resolve(__dirname, '../../../../cmsmanajer-core')
    this.userDir = path.resolve(__dirname, '../../../../scripts/' + data.user.id)
    this.id = data.id
    if (data.io) {
      this.io = data.io
    }
  }

  /**
   * It will copy base script folder without .git
   */
  public copy = () => {
    fs.copySync(this.baseDir, this.userDir, { filter: (src) => {
      console.log(src);
      !src.includes(".git") || !src.includes("files") || !src.includes("group_vars")
    }})
    return this
  }

  /**
   * Change IP address in inventory
   */
  public setIP = (ip: string) => {
    fs.writeFileSync(this.userDir + '/ansible.host', ip)
    return this
  }

  /**
   * setGroupVars
   */
  public setGroupVars({ ansible, user, app, database, wordpress }: GroupVarsArgs) {
    const file = fs.readFileSync(this.userDir + '/group_vars/all.yml', "utf8");
    const doc = yaml.parseDocument(file);
    const content = doc.contents.toString();
    const parsed: GroupVars = JSON.parse(content);


    // change group_vars
    const vars: GroupVars = {
      ...parsed,
      ansible_user: ansible?.username || parsed.ansible_user || "ubuntu",
      ansible_ssh_pass:  ansible?.password || parsed.ansible_ssh_pass,
      ansible_sudo_pass: ansible?.password || parsed.ansible_sudo_pass,
      ansible_ssh_private_key_file: ansible?.sshKey ? 'files/' + ansible.sshKey + '.pem' : parsed.ansible_ssh_private_key_file,
      username: user?.username,
      password: user?.password && this.hashPassword(user?.password),
      mysql_root_password: database?.password || parsed.mysql_root_password,
      app_username: app?.username,
      app_password: app?.password,
      app_database: app?.name && paramCase(app?.name),
      app_domain: app?.domain,
      app_config: app?.domain + '.conf',
      wordpress_home_url: 'http://' + app?.domain,
      wordpress_site_title: wordpress?.title,
      wordpress_admin_user: wordpress?.username,
      wordpress_admin_user_pass: wordpress?.password,
      wordpress_admin_email: wordpress?.email
    } 
    fs.writeFileSync(this.userDir + '/group_vars/all.yml', yaml.stringify(vars))

    return this
  }

  public run = (tag: string, options?: Options) => {
    const io = this.io
    const id = options && options.identifier ? options?.identifier : this.id

    const spw = cp.spawn("ansible-playbook", ["cman.yml", "--tags", tag], {
      cwd: this.userDir
    });

    // spw.stdout.once("data", function () {
    //   if(options && options.afterRun) options.afterRun();
    // });
    
    spw.stdout.on("data", function (data) {
      const stdout = data.toString();
      console.log(stdout);
      if (stdout.includes("TASK [Gathering Facts]")) {
        if(options && options.afterRun) options.afterRun();
      }
      if (stdout.includes("TASK")) {
        if(io) io.sockets.emit("logs" + id, stdout)
      }
    });

    spw.stderr.on("data", function (data) {
      console.log("stderr: " + data);
    });

    spw.on("error", function (code) {
      throw code;
    });

    spw.on('exit', function(code){
      console.log('Exit code: ' + code); 
      if(code != 0) {
        if(options && options.onError) options.onError();
        if(io) io.sockets.emit("error" + id, "Exit code: " + code);
      }
      //EXIT TEST HERE
    });

    spw.on("close", function (code) {
      if(code == 0) {
        if(options && options.onSuccess) options.onSuccess();
        if(io) io.sockets.emit("done" + id, "done");
      }
    });
  }

  public exec = async (tag: string, options?: Options) => {
    const io = this.io
    try {
      await execAsync(`ansible-playbook cman.yml --tags "${tag}"`, {
        cwd: this.userDir
      })
      if(options && options.onSuccess) options.onSuccess();
      if(io) io.sockets.emit("logs" + this.id, "")
    } catch (error) {
      console.log(error);
      if(options && options.onError) options.onError();
    }
  }

  public createFile = (name: string, content: string) => {
    //! tempoprary change ssh key files folder to userDir
    fs.writeFileSync(this.userDir + '/files/' + name + '.pem', content)
    cp.execSync(`chmod 400 ${name}.pem`, {
      cwd: this.userDir + '/files'
    })
  }

  private hashPassword = (password: string) => (cp.execSync(`mkpasswd -m sha-512 "${password}"`)).toString().replace(/\n/, "");

  public generatePassword = () => (crypto.randomBytes(15)).toString('base64')

  public randomString = (n: number) => (crypto.randomBytes(n)).toString('hex')
}

export default ScriptService;