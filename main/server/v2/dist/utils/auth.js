"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AuthenticationMiddleware = (req, res, next) => {
    // Verify token "Authorization" header
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send({
            message: 'Unauthorized'
        });
    }
    // Verify token
    let user;
    try {
        user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
    }
    if (!user) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }
    if (user.expiresOn < Date.now()) {
        return res.status(401).json({
            message: 'Token expired'
        });
    }
    res.locals.user = user;
    next();
};
exports.default = AuthenticationMiddleware;
//# sourceMappingURL=auth.js.map