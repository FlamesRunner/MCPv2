import express from 'express';
import { Request, Response } from 'express';
import { Connection, Error, ObjectId } from 'mongoose';
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

const ManageServerRoutes = (models: Models) => {
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

    router.post('/create', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user as IAuthData;
        const user: IUser = await UserModel.findById(auth_data._id);

        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }

        const {
            server_name,
            max_ram,
            min_ram,
            node_id,
        } = req.body;

        if (!server_name || !max_ram || !min_ram || !node_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        // Ensure username is alphanumeric and between 8-16 characters in length
        if (!/^[a-zA-Z0-9]{8,16}$/.test(server_name)) {
            return res.status(400).json({
                message: 'Server name must be alphanumeric and between 8-16 characters in length'
            });
        }

        const node: INode = await models.models.Node.model.findById(node_id);
        if (!node) {
            return res.status(400).json({
                message: 'Node not found'
            });
        }

        if (user._id.toString() !== node.owner.toString()) {
            return res.status(400).json({
                message: 'You do not own this node'
            });
        }

        // Attempt to create the server on the node
        let server_response: AxiosResponse<any>;
        const params = new URLSearchParams();
        params.append('username', server_name);

        try {
            server_response = await axios.post(`https://${node.host}:5000/create`, params, {
                headers: {
                    'TOKEN': node.token,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
            });

            if (server_response.status !== 200) {
                return res.status(500).json({
                    message: 'Failed to create server on node'
                });
            }

            if (!server_response.data.token) {
                return res.status(500).json({
                    message: server_response.data.msg
                });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Failed to communicate with node'
            });
        }

        const server = new ServerModel({
            nickname: server_name,
            host: node.host,
            token: server_response.data.token,
            parameters: {
                max_ram,
                min_ram
            },
            node: node_id
        });

        const saved_server = await server.save();

        if (!saved_server) {
            return res.status(500).json({
                message: 'Server could not be created'
            });
        }

        user.servers.push(saved_server._id);
        await user.save();

        return res.json({
            server: saved_server
        });
    });

    router.post('/delete', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user as IAuthData;
        const user: IUser = await UserModel.findById(auth_data._id);

        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }

        const {
            server_id
        } = req.body;

        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const server: IServer = await ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }

        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }

        // Get the node associated with the server
        const node: INode = await models.models.Node.model.findById(server.node);
        if (!node) {
            return res.status(500).json({
                message: 'Node not found'
            });
        }

        // Attempt to delete the server on the node
        let server_response: AxiosResponse<any>;
        const params = new URLSearchParams();
        params.append('username', server.nickname);
        params.append('token', node.token);

        try {
            server_response = await axios.post(`https://${server.host}:5000/delete`, params, {
                headers: {
                    'TOKEN': server.token,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
            });

            if (server_response.status !== 200) {
                return res.status(500).json({
                    message: 'Failed to delete server on node'
                });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Failed to communicate with node'
            });
        }

        await ServerModel.findByIdAndRemove(server_id);

        user.servers = user.servers.filter((server_id: string) => {
            return server_id.toString() !== server_id.toString();
        });

        await user.save();

        return res.json({
            message: 'Server deleted'
        });
    });

    return router;
}

export default ManageServerRoutes;