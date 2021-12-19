"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const UserRoutes = (models) => {
    const UserModel = models.models.User.model;
    router.get('/', (req, res) => {
        res.json({
            message: 'MCPv2 User API, at your service!'
        });
    });
    router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        if (!req.body.username || !req.body.password || !req.body.email) {
            res.status(400).json({
                message: 'Missing username or password'
            });
            return;
        }
        // Check if the username is between 4-32 characters
        if (req.body.username.length < 4 || req.body.username.length > 32) {
            res.status(400).json({
                message: 'Username must be between 4-32 characters'
            });
            return;
        }
        // Check if the password is at least 8 characters
        if (req.body.password.length < 8) {
            res.status(400).json({
                message: 'Password must be at least 8 characters'
            });
            return;
        }
        // Check if the email is valid
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) {
            res.status(400).json({
                message: 'Invalid email'
            });
            return;
        }
        // Check if the username is already taken
        const user = yield UserModel.findOne({
            username: req.body.username
        });
        if (user) {
            res.status(400).json({
                message: 'Username already taken'
            });
            return;
        }
        // Check if the email is already taken
        const email = yield UserModel.findOne({
            email: req.body.email
        });
        if (email) {
            res.status(400).json({
                message: 'Email already taken'
            });
            return;
        }
        const hashed_password = bcrypt_1.default.hashSync(req.body.password, 10);
        // Create the user
        const newUser = yield UserModel.create({
            username: req.body.username,
            password: hashed_password,
            email: req.body.email,
            servers: []
        });
        if (newUser) {
            res.json({
                message: 'User created successfully',
                user: newUser,
                token: jsonwebtoken_1.default.sign({
                    _id: newUser._id,
                    username: newUser.username,
                    email: newUser.email
                }, process.env.JWT_SECRET, {
                    expiresIn: '3h'
                }),
                expiresAt: new Date(Date.now() + (3 * 60 * 60 * 1000)).getTime()
            });
            return;
        }
        res.status(500).json({
            message: 'Error creating user'
        });
    }));
    router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the appropriate fields are present
        if ((!req.body.username && !req.body.email) || !req.body.password) {
            return res.status(400).json({
                message: 'Missing username/email and password'
            });
        }
        // Attempt to find the user
        const user = yield UserModel.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ],
        });
        if (!user || !bcrypt_1.default.compareSync(req.body.password, user.password)) {
            return res.status(401).json({
                message: 'Invalid username/email or password'
            });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({
            _id: user._id,
            username: user.username,
            email: user.email
        }, process.env.JWT_SECRET, {
            expiresIn: '3h'
        });
        res.json({
            message: 'Login successful',
            token: token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            expiresAt: new Date(Date.now() + (3 * 60 * 60 * 1000)).getTime()
        });
    }));
    router.get('/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }
        try {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    });
                }
                const user = yield UserModel.findOne({
                    _id: decoded._id
                });
                if (!user) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    });
                }
                const token = jsonwebtoken_1.default.sign({
                    _id: user._id,
                    username: user.username,
                    email: user.email
                }, process.env.JWT_SECRET, {
                    expiresIn: '3h'
                });
                res.json({
                    message: 'Token refreshed',
                    token: token,
                    user: {
                        _id: user._id,
                        username: user.username,
                        email: user.email
                    },
                    expiresAt: new Date(Date.now() + (3 * 60 * 60 * 1000)).getTime()
                });
            }));
        }
        catch (err) {
            res.status(500).json({
                message: 'Error refreshing token'
            });
        }
    }));
    router.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }
        try {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    });
                }
                const user = yield UserModel.findOne({
                    _id: decoded._id
                });
                if (!user) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    });
                }
                // Check if the email is valid
                if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) {
                    res.status(400).json({
                        message: 'Invalid email'
                    });
                    return;
                }
                user.email = req.body.email;
                if (req.body.password && req.body.password.length > 0) {
                    // Check if the password is at least 8 characters
                    if (req.body.password.length < 8) {
                        res.status(400).json({
                            message: 'Password must be at least 8 characters'
                        });
                        return;
                    }
                    // Check if the password matches the confirmation
                    if (req.body.password !== req.body.confirmPassword) {
                        res.status(400).json({
                            message: 'Passwords do not match'
                        });
                        return;
                    }
                    const hashed_password = bcrypt_1.default.hashSync(req.body.password, 10);
                    user.password = hashed_password;
                }
                yield user.save();
                res.json({
                    message: 'User updated successfully',
                    email: user.email
                });
            }));
        }
        catch (err) {
            res.status(500).json({
                message: 'Error updating user'
            });
        }
    }));
    return router;
};
exports.default = UserRoutes;
//# sourceMappingURL=User.js.map