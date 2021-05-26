# CMS Manajer

### example
#### prerequisite for example request

**1. folder structure**
```
cadabra-cmsmanajer-app
├── cmsmanajer-generator
├── optimiz
└── scripts
    └── test
        └── config.json
```
**2. initialized git in folder test**


#### example request
```
POST http://localhost:5000/api/server
Content-Type: application/json

{
  "name": "server A",
  "ip": "192.168.3.10",
  "username": "ubuntu",
  "password": "4esz3wa2q10p",
  "email": "test"
}
```
