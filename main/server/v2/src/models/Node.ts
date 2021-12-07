import { Mongoose, Document, ObjectId } from "mongoose";

interface INode extends Document {
    nickname: string;
    token: string;
    host: string;
    owner: ObjectId;
}

const NodeSchema = (mongoose: Mongoose) => {
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
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    });

    return schema;
}

export { NodeSchema, INode };