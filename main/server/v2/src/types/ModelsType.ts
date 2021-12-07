import { Model, Schema } from "mongoose";
import { IUser } from "../models/User";
import {IServer} from "../models/Server";
import { INode } from "../models/Node";

type Models = {
    models: {
        User: {
            model: Model<IUser, any>,
            schema: Schema<any, Model<any, any, any, any>, any>,
        },
        Server: {
            model: Model<IServer, any>,
            schema: Schema<any, Model<any, any, any, any>, any>,
        },
        Node: {
            model: Model<INode, any>,
            schema: Schema<any, Model<any, any, any, any>, any>,
        }
    }
}

export { Models };