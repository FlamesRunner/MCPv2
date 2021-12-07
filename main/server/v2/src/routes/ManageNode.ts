import express from 'express';
import { Request, Response } from 'express';
import { Connection, Error } from 'mongoose';
import { IUser } from '../models/User';
import { Models } from '../types/ModelsType';
import bcrypt from 'bcrypt';
import AuthenticationMiddleware from '../utils/auth';
import IAuthData from 'AuthData';
import { IServer } from '../models/Server';
import { INode } from '../models/Node';
import axios from 'axios';
import { AxiosResponse } from 'axios';
import https from 'https';

const router = express.Router();

const ManageNode = (models: Models) => {
    const UserModel = models.models.User.model;
    const ServerModel = models.models.Server.model;
    const NodeModel = models.models.Node.model;

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

        const user_nodes: INode[] = await NodeModel.find({
            owner: user._id
        });

        // Strip token from response
        for (const node of user_nodes) {
            node.token = undefined;
        }

        return res.json({
            nodes: user_nodes
        });
    });

    router.post('/create', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user as IAuthData;
        const user: IUser = await UserModel.findById(auth_data._id);

        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }

        // Check if the node_hostname and token are present
        if (!req.body.node_hostname || !req.body.token) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        // Check if the nickname is valid
        if (req.body.nickname && ((req.body.nickname.length > 32 || req.body.nickname.length < 6) || !req.body.nickname.search(/^[a-zA-Z0-9-_.]+$/))) {
            return res.status(400).json({
                message: 'Invalid nickname. It must be between 6 and 32 characters long, and can only contain letters, numbers, dashes, underscores and periods.'
            });
        }

        // Check if node hostname is unique
        const node_hostname = req.body.node_hostname;
        const node_hostname_exists = await NodeModel.findOne({
            host: node_hostname
        });

        if (node_hostname_exists) {
            return res.status(400).json({
                message: 'Node IP already in use'
            });
        }

        // Check if we can connect to the node
        const node_connection: AxiosResponse<any, any> = await axios.get(`https://${node_hostname}:5000/user`, {
            headers: {
                'TOKEN': `${req.body.token}`
            },
            timeout: 5000,
            httpsAgent: new (https.Agent)({
                rejectUnauthorized: false
            })
        });

        if (node_connection.status !== 200) {
            return res.status(400).json({
                message: 'Failed to connect to node: Authorization failed'
            });
        }

        console.log(node_connection.data);

        // Check if we are authenticated on the node as the 'root' user
        try {
            const node_user_data: any = node_connection.data;
            if (!node_user_data || node_user_data.username !== 'root') {
                return res.status(400).json({
                    message: 'Failed to connect to node: User not root'
                });
            }
        } catch (e) {
            return res.status(400).json({
                message: 'Invalid response from node. Are you sure you\'re connecting to the correct host?'
            });
        }

        // Create the node
        const node = new NodeModel({
            nickname: req.body.nickname || node_hostname,
            host: node_hostname,
            owner: user._id,
            token: req.body.token
        });

        const new_node = await node.save();

        if (!new_node) {
            return res.status(500).json({
                message: 'Failed to create node'
            });
        }

        return res.json({
            message: 'Node created successfully',
            node: new_node
        });
    });

    return router;
}

export default ManageNode;