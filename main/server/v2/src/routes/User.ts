import express from 'express';
import { Request, Response } from 'express';
import { Connection, Error } from 'mongoose';
import { IUser } from '../models/User';
import { Models } from '../types/ModelsType';
import bcrypt from 'bcrypt';

const router = express.Router();

const UserRoutes = (models: Models) => {
    const UserModel = models.models.User.model;

    router.get('/', (req, res) => {
        res.json({
            message: 'MCPv2 User API, at your service!'
        })
    });

    router.post('/create', async (req : Request, res : Response) => {
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
            servers: [],
            role: 'user'
        });

        if (newUser) {
            res.json({
                message: 'User created successfully'
            });
            return;
        }

        res.status(500).json({
            message: 'Error creating user'
        });
    });
    return router;
}

export default UserRoutes;