import { Mongoose, Document, ObjectId } from "mongoose";

interface IServer extends Document {
    nickname: string;
    token: string;
    host: string;
    parameters: {
        max_ram: number;
        min_ram: number;
    };
    node: ObjectId;
}

const ServerSchema = (mongoose: Mongoose) => {
    const schema = new mongoose.Schema({
        nickname: {
            type: String,
            required: true,
            unique: true
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        host: {
            type: String,
            required: true
        },
        parameters: {
            max_ram: {
                type: Number,
                required: true
            },
            min_ram: {
                type: Number,
                required: true
            }
        },
        node: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Node",
            required: true
        }
    });

    return schema;
}

export { ServerSchema, IServer };