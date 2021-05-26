import fs from 'fs-extra';
import path from 'path';

class ScriptService {
  baseDir: string = null
  userDir: string = null
  folder = {
    server: "/optimiz",
    app: "/core"
  }

  constructor(config?) {
    if(config)
      this.setConfig(config)
  }

  /**
   * setConfig
   */
  public setConfig({ data, type }) {
    this.baseDir = path.resolve(__dirname, '../../../../' + this.folder[type])
    this.userDir = path.resolve(__dirname, '../../../../scripts/' + data.email + this.folder[type])
  }

  /**
   * It will copy base script folder without .git
   */
  public copy = () => {
    fs.copySync(this.baseDir, this.userDir, { filter: (src) => !src.includes(".git")})
    return this
  }

  /**
   * Change IP address in inventory
   */
  public setIP = (ip: string) => {
    fs.writeFileSync(this.userDir + '/inventory', ip)
    return this
  }

  /**
   * setVars
   */
  public setVars({ username, password, sshKey = "files/sgnd.pem" }) {
    // change group_vars
    const vars = 
`# ssh
ansible_connection: ssh
ansible_user: ${username}
ansible_ssh_pass: ${password}
ansible_sudo_pass: ${password}
ansible_ssh_private_key_file: ${sshKey}
ansible_python_interpreter: /usr/bin/python3

# users
pass_auth: PasswordAuthentication yes
pubkey_auth: PubkeyAuthentication yes`
    
    fs.writeFileSync(this.userDir + '/group_vars/all.yml', vars)

    return this
  }
}

export default ScriptService;