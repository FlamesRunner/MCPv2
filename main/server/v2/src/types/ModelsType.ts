import { Model, Schema } from "mongoose";
import { IUser } from "../models/User";

type Models = {
    models: {
        User: {
            model: Model<IUser, any>,
            schema: Schema<any, Model<any, any, any, any>, any>,
        }
    }
}

export { Models };