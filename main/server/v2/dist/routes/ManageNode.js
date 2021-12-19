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
const ManageNode = (models) => {
    const UserModel = models.models.User.model;
    const ServerModel = models.models.Server.model;
    const NodeModel = models.models.Node.model;
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
        const user_nodes = yield NodeModel.find({
            owner: user._id
        });
        // Strip token from response
        for (const node of user_nodes) {
            node.token = undefined;
        }
        return res.json({
            nodes: user_nodes
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
        // Check if the node_hostname and token are present
        if (!req.body.node_hostname || !req.body.token) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        // Check if the nickname is valid
        if (req.body.nickname && ((req.body.nickname.length > 32 || req.body.nickname.length < 6) || !req.body.nickname.match(/^[a-z\d\-_.\s]+$/i))) {
            return res.status(400).json({
                message: 'Invalid nickname. It must be between 6 and 32 characters long, and can only contain letters, numbers, dashes, underscores and periods.'
            });
        }
        // Check if node hostname is unique
        const node_hostname = req.body.node_hostname;
        const node_hostname_exists = yield NodeModel.findOne({
            host: node_hostname
        });
        if (node_hostname_exists) {
            return res.status(400).json({
                message: 'Node IP already in use'
            });
        }
        // Check if we can connect to the node
        const node_connection = yield axios_1.default.get(`https://${node_hostname}:5000/user`, {
            headers: {
                'TOKEN': `${req.body.token}`
            },
            timeout: 5000,
            httpsAgent: new (https_1.default.Agent)({
                rejectUnauthorized: false
            })
        });
        if (node_connection.status !== 200) {
            return res.status(400).json({
                message: 'Failed to connect to node: Authorization failed'
            });
        }
        // Check if we are authenticated on the node as the 'root' user
        try {
            const node_user_data = node_connection.data;
            if (!node_user_data || node_user_data.username !== 'root') {
                return res.status(400).json({
                    message: 'Failed to connect to node: User not root'
                });
            }
        }
        catch (e) {
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
        const new_node = yield node.save();
        if (!new_node) {
            return res.status(500).json({
                message: 'Failed to create node'
            });
        }
        return res.json({
            message: 'Node created successfully',
            node: new_node
        });
    }));
    return router;
};
exports.default = ManageNode;
//# sourceMappingURL=ManageNode.js.map