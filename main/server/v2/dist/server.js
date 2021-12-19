"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
// User model and routes
const User_1 = require("./models/User");
const User_2 = __importDefault(require("./routes/User"));
// Server model and routes
const Server_1 = require("./models/Server");
const ManageServer_1 = __importDefault(require("./routes/ManageServer"));
// Node model and routes
const Node_1 = require("./models/Node");
const ManageNode_1 = __importDefault(require("./routes/ManageNode"));
// SFTP routes
const SFTPClient_1 = __importDefault(require("./routes/SFTPClient"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
const mongodb_uri = process.env.MONGO_URI || 'mongodb://localhost/mcpv2-api';
const app = (0, express_1.default)();
const mongoose = new mongoose_1.Mongoose();
mongoose.connect(mongodb_uri);
function get_models(mongoose) {
    const userSchema = (0, User_1.UserSchema)(mongoose);
    const userModel = mongoose.model('User', userSchema);
    const serverSchema = (0, Server_1.ServerSchema)(mongoose);
    const serverModel = mongoose.model('Server', serverSchema);
    const nodeSchema = (0, Node_1.NodeSchema)(mongoose);
    const nodeModel = mongoose.model('Node', nodeSchema);
    return {
        models: {
            User: {
                model: userModel,
                schema: userSchema,
            },
            Server: {
                model: serverModel,
                schema: serverSchema,
            },
            Node: {
                model: nodeModel,
                schema: nodeSchema,
            },
        },
    };
}
mongoose.connection.on('open', () => {
    // Define models
    const models = get_models(mongoose);
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_ORIGIN || '*',
    }));
    app.use(body_parser_1.default.json({
        limit: '2gb',
    }));
    app.use(body_parser_1.default.urlencoded({ extended: true, limit: '2gb' }));
    app.listen(PORT, () => {
        console.log(`MCPv2 API server running on port ${PORT}`);
    });
    app.get('/', (req, res) => {
        res.send('MCPv2 API server, at your service!');
    });
    const UserRouter = (0, User_2.default)(models);
    app.use('/api/v1/user', UserRouter);
    const ServerRouter = (0, ManageServer_1.default)(models);
    app.use('/api/v1/server', ServerRouter);
    const NodeRouter = (0, ManageNode_1.default)(models);
    app.use('/api/v1/node', NodeRouter);
    const SFTPRouter = (0, SFTPClient_1.default)();
    app.use('/api/v1/sftp', SFTPRouter);
});
//# sourceMappingURL=server.js.map