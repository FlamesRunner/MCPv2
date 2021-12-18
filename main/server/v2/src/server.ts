import { Model, Mongoose, Schema } from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { Models } from "./types/ModelsType";

// User model and routes
import {UserSchema, IUser} from "./models/User";
import UserRoutes from "./routes/User";

// Server model and routes
import {ServerSchema, IServer} from "./models/Server";
import ServerRoutes from "./routes/ManageServer";

// Node model and routes
import {NodeSchema, INode} from "./models/Node";
import NodeRoutes from "./routes/ManageNode";

// SFTP routes
import SFTPRoutes from "./routes/SFTPClient";

dotenv.config();

const PORT = process.env.PORT || 3001;
const mongodb_uri = process.env.MONGO_URI || 'mongodb://localhost/mcpv2-api';
const app = express();

const mongoose = new Mongoose();
mongoose.connect(mongodb_uri);

function get_models (mongoose: Mongoose): Models {
    const userSchema = UserSchema(mongoose);
    const userModel = mongoose.model<IUser>('User', userSchema);
    const serverSchema = ServerSchema(mongoose);
    const serverModel = mongoose.model<IServer>('Server', serverSchema);
    const nodeSchema = NodeSchema(mongoose);
    const nodeModel = mongoose.model<INode>('Node', nodeSchema);

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
    const models : Models = get_models(mongoose);
    app.use(cors({
        origin: process.env.FRONTEND_ORIGIN || '*',
    }));

    app.use(bodyParser.json({
        limit: '2gb',
    }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '2gb' }));

    app.listen(PORT, () => {
        console.log(`MCPv2 API server running on port ${PORT}`);
    });

    app.get('/', (req, res) => {
        res.send('MCPv2 API server, at your service!');
    });

    const UserRouter = UserRoutes(models);
    app.use('/api/v1/user', UserRouter);

    const ServerRouter = ServerRoutes(models);
    app.use('/api/v1/server', ServerRouter);

    const NodeRouter = NodeRoutes(models);
    app.use('/api/v1/node', NodeRouter);

    const SFTPRouter = SFTPRoutes();
    app.use('/api/v1/sftp', SFTPRouter);
});