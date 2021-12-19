"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../utils/auth"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const router = express_1.default.Router();
const ServerAction = ({ action, server, data = new URLSearchParams() }) => {
    const url = `https://${server.host}:5000/${action}`;
    const options = {
        headers: {
            'TOKEN': server.token,
        },
        httpsAgent: new https_1.default.Agent({
            rejectUnauthorized: false
        }),
    };
    return axios_1.default.post(url, data, options);
};
const ManageServerRoutes = (models) => {
    const UserModel = models.models.User.model;
    const ServerModel = models.models.Server.model;
    router.get('/', (req, res) => {
        res.json({
            message: 'MCPv2 Server Management API, at your service! Please be aware that this is an authenticated API.'
        });
    });
    router.get('/list', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const user_servers = user.servers;
        const servers = yield ServerModel.find({
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
    }));
    router.post('/create', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const { server_name, max_ram, min_ram, node_id, } = req.body;
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
        const node = yield models.models.Node.model.findById(node_id);
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
        let server_response;
        const params = new URLSearchParams();
        params.append('username', server_name);
        try {
            server_response = yield axios_1.default.post(`https://${node.host}:5000/create`, params, {
                headers: {
                    'TOKEN': node.token,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                httpsAgent: new https_1.default.Agent({
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
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Failed to communicate with node'
            });
        }
        const server = new ServerModel({
            nickname: server_name.toLowerCase(),
            host: node.host,
            token: server_response.data.token,
            parameters: {
                max_ram,
                min_ram
            },
            node: node_id
        });
        const saved_server = yield server.save();
        if (!saved_server) {
            return res.status(500).json({
                message: 'Server could not be created'
            });
        }
        user.servers.push(saved_server._id);
        yield user.save();
        return res.json({
            server: saved_server
        });
    }));
    router.post('/delete', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const { server_id } = req.body;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        const server = yield ServerModel.findById(server_id);
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
        const node = yield models.models.Node.model.findById(server.node);
        if (!node) {
            return res.status(500).json({
                message: 'Node not found'
            });
        }
        // Attempt to delete the server on the node
        let server_response;
        const params = new URLSearchParams();
        params.append('username', server.nickname);
        try {
            server_response = yield axios_1.default.post(`https://${node.host}:5000/delete`, params, {
                headers: {
                    'TOKEN': node.token,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                httpsAgent: new https_1.default.Agent({
                    rejectUnauthorized: false
                }),
            });
            if (server_response.status !== 200) {
                return res.status(500).json({
                    message: 'Failed to delete server on node'
                });
            }
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Failed to communicate with node'
            });
        }
        yield ServerModel.findByIdAndRemove(server_id);
        user.servers = user.servers.filter((server_id) => {
            return server_id.toString() !== server_id.toString();
        });
        yield user.save();
        return res.json({
            message: 'Server deleted'
        });
    }));
    router.post('/start', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const { server_id } = req.body;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const params = new URLSearchParams();
        params.append('min_ram', server.parameters.min_ram.toString() + 'M');
        params.append('max_ram', server.parameters.max_ram.toString() + 'M');
        const result = yield ServerAction({ server, action: 'start', data: params });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        return res.json({
            message: 'Server started'
        });
    }));
    router.post('/stop', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const { server_id } = req.body;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const result = yield ServerAction({ server, action: 'stop' });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        return res.json({
            message: 'Server stopped'
        });
    }));
    router.post('/kill', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const { server_id } = req.body;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const result = yield ServerAction({ server, action: 'kill' });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        return res.json({
            message: 'Server killed'
        });
    }));
    router.post('/execute', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const { server_id, command } = req.body;
        if (!server_id || !command) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const params = new URLSearchParams();
        params.append('cmd', command);
        const result = yield ServerAction({ server, action: 'cmd', data: params });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        return res.json({
            message: 'Command executed'
        });
    }));
    router.get('/log/:server_id', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const server_id = req.params.server_id;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const result = yield axios_1.default.get(`https://${server.host}:5000/log`, {
            headers: {
                'TOKEN': `${server.token}`
            },
            httpsAgent: new https_1.default.Agent({
                rejectUnauthorized: false
            })
        });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        return res.json({
            message: 'Log fetched',
            logs: result.data.log,
        });
    }));
    router.get('/status/:server_id', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const server_id = req.params.server_id;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const result = yield axios_1.default.get(`https://${server.host}:5000/status`, {
            headers: {
                'TOKEN': `${server.token}`
            },
            httpsAgent: new https_1.default.Agent({
                rejectUnauthorized: false
            })
        });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        server.token = "";
        return res.json({
            message: 'Server status retrieved',
            status: result.data,
            server: server
        });
    }));
    router.get('/sftp/:server_id', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const server_id = req.params.server_id;
        if (!server_id) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if user owns the server
        if (user.servers.indexOf(server_id) === -1) {
            return res.status(400).json({
                message: 'You do not own this server'
            });
        }
        const server = yield ServerModel.findById(server_id);
        if (!server) {
            return res.status(400).json({
                message: 'Server not found'
            });
        }
        const result = yield axios_1.default.get(`https://${server.host}:5000/sftp`, {
            headers: {
                'TOKEN': `${server.token}`
            },
            httpsAgent: new https_1.default.Agent({
                rejectUnauthorized: false
            })
        });
        if (result.status !== 200) {
            return res.status(500).json({
                message: result.data.msg
            });
        }
        server.token = "";
        return res.json({
            message: 'SFTP password generated',
            username: server.nickname,
            password: result.data.password,
        });
    }));
    router.get('/summary', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Get server status for all servers
        const auth_data = res.locals.user;
        const user = yield UserModel.findById(auth_data._id);
        if (!user) {
            return res.status(500).json({
                message: 'User not found'
            });
        }
        const server_ids = user.servers;
        const servers = yield ServerModel.find({ _id: { $in: server_ids } });
        if (!servers) {
            return res.status(200).json({
                message: 'Server status retrieved',
                servers: []
            });
        }
        const server_status = [];
        const promises = servers.map((server) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield axios_1.default.get(`https://${server.host}:5000/status`, {
                headers: {
                    'TOKEN': `${server.token}`
                },
                httpsAgent: new https_1.default.Agent({
                    rejectUnauthorized: false
                })
            });
            if (result.status !== 200) {
                server_status.push({
                    hostname: server.host,
                    nickname: server.nickname,
                    status: 'offline'
                });
            }
            else {
                server_status.push({
                    hostname: server.host,
                    nickname: server.nickname,
                    status: result.data.power_level
                });
            }
        }));
        yield Promise.all(promises);
        return res.json({
            message: 'Server status retrieved',
            servers: server_status
        });
    }));
    return router;
};
exports.default = ManageServerRoutes;
//# sourceMappingURL=ManageServer.js.map