"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeSchema = void 0;
const NodeSchema = (mongoose) => {
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
};
exports.NodeSchema = NodeSchema;
//# sourceMappingURL=Node.js.map