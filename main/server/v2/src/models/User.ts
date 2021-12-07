import { Mongoose, Document } from "mongoose";

interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    servers: string[];
    role: string;
}

const UserSchema = (mongoose: Mongoose) => {
    const schema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        servers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Server'
        }],
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        }
    });

    return schema;
};

export {UserSchema, IUser};