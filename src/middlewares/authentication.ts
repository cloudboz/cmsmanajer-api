import { Request, Response } from 'express'
import jwt from 'jsonwebtoken';

import { SECRET_KEY } from '../../config/global.json'
import { UserData } from '../types'

interface User {
  user: UserData;
}

const authentication = async (req: Request & User, res: Response, next: () => void )  => {

    const nonSecurePaths = ['/', '/login', '/register'];
    if (nonSecurePaths.includes(req.path)) return next();

    const token: string | string[] = req.headers["x-access-token"] || req.headers["authorization"].replace('Bearer ', '');
    //if no token found, return response (without going to the next middelware)
    if (!token){
      return res.status(401).json("Access denied. No token provided.");
    }
  
    try {
      //if can verify the token, set req.user and pass to next middleware
      const decoded = await jwt.verify(token, SECRET_KEY);
      req.user.id = decoded.sub;

      return next();
    } catch (e) {
      //if invalid token
      console.log('error middleware authentication', e.message)
      res.status(401).json("Invalid token.");
    }
}

export default authentication