# CMS Manajer

> Gateway API for CMS Manajer

## Getting Started

Getting up and running is as easy as 1, 2, 3.

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install your dependencies

    ```
    cd path/to/cmsmanajer-generator
    npm install
    ```

3. Start your app

    ```
    npm run dev
    ```

Application will run on port **5000**

## example
#### prerequisite for example request

**1. folder structure**
```
cadabra-cmsmanajer-app
├── cmsmanajer-generator
├── optimiz
└── scripts
    └── {{ id }}
        └── user.json
```
**2. initialized git in folder test**


#### example request
```
POST http://localhost:5000/api/servers
Content-Type: application/json

{
  "name": "server A",
  "ip": "192.168.3.10",
  "username": "ubuntu",
  "password": "4esz3wa2q10p",
  "email": "test"
}
```
