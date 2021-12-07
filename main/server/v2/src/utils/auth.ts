import {Request, Response, NextFunction} from 'express';
import IAuthData from 'AuthData';
import jwt from 'jsonwebtoken';

const AuthenticationMiddleware = (req : Request, res : Response, next : NextFunction) => {
    // Verify token "Authorization" header
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send({
            message: 'Unauthorized'
        });
    }

    // Verify token
    const user = jwt.verify(token, process.env.JWT_SECRET) as IAuthData;

    if (!user) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    if (user.expiresOn < Date.now()) {
        return res.status(401).json({
            message: 'Token expired'
        });
    }
    
    res.locals.user = user;
    next();
};

export default AuthenticationMiddleware;
    

