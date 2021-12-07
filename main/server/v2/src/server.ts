import { Model, Mongoose, Schema } from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { Models } from "./types/ModelsType";
dotenv.config();

// User model and routes
import {UserSchema, IUser} from "./models/User";
import UserRoutes from "./routes/User";

// Server model and routes
import {ServerSchema, IServer} from "./models/Server";
import ServerRoutes from "./routes/ManageServer";

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
        },
    };
}

mongoose.connection.on('open', () => {
    // Define models
    const models : Models = get_models(mongoose);

    app.use(cors());
    app.use(bodyParser.json());

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
});