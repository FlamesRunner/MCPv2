import express from 'express';
import { Request, Response } from 'express';
import { Connection, Error } from 'mongoose';
import { IUser } from '../models/User';
import { Models } from '../types/ModelsType';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

const router = express.Router();

type AuthData = {
    _id: string,
    username: string,
    email: string
    iat: number,
    exp: number
}

const UserRoutes = (models: Models) => {
    const UserModel = models.models.User.model;

    router.get('/', (req, res) => {
        res.json({
            message: 'MCPv2 User API, at your service!'
        })
    });

    router.post('/create', async (req: Request, res: Response) => {
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
        const user = await UserModel.findOne({
            username: req.body.username
        });

        if (user) {
            res.status(400).json({
                message: 'Username already taken'
            });
            return;
        }

        // Check if the email is already taken
        const email = await UserModel.findOne({
            email: req.body.email
        });

        if (email) {
            res.status(400).json({
                message: 'Email already taken'
            });
            return;
        }

        const hashed_password = bcrypt.hashSync(req.body.password, 10);

        // Create the user
        const newUser = await UserModel.create({
            username: req.body.username,
            password: hashed_password,
            email: req.body.email,
            servers: []
        });

        if (newUser) {
            res.json({
                message: 'User created successfully',
                user: newUser,
                token: jwt.sign({
                    _id: newUser._id,
                    username: newUser.username,
                    email: newUser.email
                }, process.env.JWT_SECRET,
                    {
                        expiresIn: '3h'
                    }),
                expiresAt: new Date(Date.now() + (3 * 60 * 60 * 1000)).getTime()
            });
            return;
        }

        res.status(500).json({
            message: 'Error creating user'
        });
    });

    router.post('/login', async (req: Request, res: Response) => {
        // Check if the appropriate fields are present
        if ((!req.body.username && !req.body.email) || !req.body.password) {
            return res.status(400).json({
                message: 'Missing username/email and password'
            });
        }

        // Attempt to find the user
        const user: any = await UserModel.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ],
        });

        if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(401).json({
                message: 'Invalid username/email or password'
            });
        }

        // Generate JWT
        const token = jwt.sign({
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
    });

    router.get('/refresh', async (req: Request, res: Response) => {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET, async (err: Error, decoded: AuthData) => {
                if (err) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    });
                }

                const user = await UserModel.findOne({
                    _id: decoded._id
                });

                if (!user) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    });
                }

                const token = jwt.sign({
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
            })
        } catch (err) {
            res.status(500).json({
                message: 'Error refreshing token'
            });
        }
    });

    return router;
}

export default UserRoutes;