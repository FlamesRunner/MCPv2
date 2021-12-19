"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerSchema = void 0;
const ServerSchema = (mongoose) => {
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
};
exports.ServerSchema = ServerSchema;
//# sourceMappingURL=Server.js.map