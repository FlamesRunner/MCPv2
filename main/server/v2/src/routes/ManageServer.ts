import express from 'express';
import { Request, Response } from 'express';
import { Connection, Error } from 'mongoose';
import { IUser } from '../models/User';
import { Models } from '../types/ModelsType';
import bcrypt from 'bcrypt';
import AuthenticationMiddleware from '../utils/auth';
import IAuthData from 'AuthData';
import { IServer } from '../models/Server';

const router = express.Router();

const UserRoutes = (models: Models) => {
    const UserModel = models.models.User.model;
    const ServerModel = models.models.Server.model;

    router.get('/', (req, res) => {
        res.json({
            message: 'MCPv2 Server Management API, at your service! Please be aware that this is an authenticated API.'
        })
    });

    router.get('/list', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user as IAuthData;
        const user: IUser = await UserModel.findById(auth_data._id);

        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }

        const user_servers = user.servers;

        const servers: IServer[] = await ServerModel.find({
            _id: {
                $in: user_servers
            }
        });

        for (const server of servers) {
            server.token = undefined;
        }

        return res.json({
            servers
        });
    });
    return router;
}

export default UserRoutes;