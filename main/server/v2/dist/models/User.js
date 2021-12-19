"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const UserSchema = (mongoose) => {
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
            }]
    });
    return schema;
};
exports.UserSchema = UserSchema;
//# sourceMappingURL=User.js.map