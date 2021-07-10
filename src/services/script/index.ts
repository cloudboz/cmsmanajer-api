import fs from 'fs-extra';
import cp from 'child_process';
import path from 'path';
import crypto from 'crypto';
import yaml, { parse } from 'yaml';
import { GroupVars, GroupVarsArgs } from '../../types';
import { paramCase } from "param-case";

class ScriptService {
  baseDir: string = null
  userDir: string = null

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
  }

  /**
   * It will copy base script folder without .git
   */
  public copy = () => {
    fs.copySync(this.baseDir, this.userDir, { filter: (src) => (!src.includes(".git") || !src.includes("files"))})
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
      ansible_user: ansible.username || "ubuntu",
      ansible_ssh_pass: ansible.password || this.generatePassword(),
      ansible_sudo_pass: ansible.password || this.generatePassword(),
      ansible_ssh_private_key_file: 'files/' + ansible.sshKey,
      username: user?.username,
      password: user?.password && this.hashPassword(user?.password),
      mysql_root_password: database?.password || this.generatePassword(),
      app_username: app?.username || this.randomString(4),
      app_password: app?.password || this.generatePassword(),
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

  public run = (tag: string) => cp.execSync(`ansible-playbook cman.yml --tags "${tag}"`, {
    cwd: this.userDir
  })

  public createFile = (name: string, content: string) => fs.writeFileSync(this.baseDir + '/files/' + name + '.pem', content)

  private hashPassword = (password: string) => (cp.execSync(`mkpasswd -m sha-512 "${password}"`)).toString('hex')

  public generatePassword = () => (crypto.randomBytes(15)).toString('base64')

  public randomString = (n: number) => (crypto.randomBytes(n)).toString('hex')
}

export default ScriptService;