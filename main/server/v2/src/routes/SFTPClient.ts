import express from 'express';
import { Request, Response } from 'express';
import { Connection, Error } from 'mongoose';
import { IUser } from '../models/User';
import { Models } from '../types/ModelsType';
import bcrypt from 'bcrypt';
import AuthenticationMiddleware from '../utils/auth';
import IAuthData from 'AuthData';
import { IServer } from '../models/Server';
import { INode } from '../models/Node';
import axios from 'axios';
import { AxiosResponse } from 'axios';
import https from 'https';
import Client, { FileInfo } from "ssh2-sftp-client";
import { SFTPWrapper } from "ssh2";
import multer from "multer";
import fs from 'fs';
import { Stream } from 'stream';

const router = express.Router();

type IInode = {
    name: string,
    type: 'd' | '-' | 'l',
    size: number,
    modifyTime: number,
    accessTime: number,
    owner: number,
    group: number,
    rights: {
        user: string,
        group: string,
        other: string
    }
}

const getClient = (req: Request): { sftpWrapper: Promise<SFTPWrapper>, client: Client } => {
    const client: Client = new Client();
    return {
        sftpWrapper: client.connect({
            host: req.body.host || req.query.host,
            username: req.body.username || req.query.username,
            password: req.body.password || req.query.password,
            port: 22,
            readyTimeout: 5000
        }), client: client
    }
}

const SFTPClient = () => {
    const upload = multer({ dest: 'uploads/', limits: { fileSize: 2147483648 } });

    router.all('/', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        res.json({
            message: 'MCPv2 SFTP Client API, at your service!',
        })
    });

    router.post('/ls', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        const path = req.body.path || '/';
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(async () => {
            const result: IInode[] = await client.list(path);
            res.json({
                message: 'Listing files',
                data: result
            });
        }).catch((err: Error) => {
            res.status(500).json({
                message: 'Error listing files',
                error: err
            });
        }).finally(() => {
            client.end().catch(e => {});
        })
    });

    router.post('/rm', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        const path = req.body.path;
        if (!path) {
            res.status(400).json({
                message: 'No path specified',
                error: 'No path specified'
            });
            return;
        }
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(async () => {
            const result = await client.delete(path);
            res.json({
                message: 'File removed',
                data: result
            });
        }).catch((err: Error) => {
            res.status(500).json({
                message: 'Error listing files',
                error: err
            });
        }).finally(() => {
            client.end().catch(e => {});
        })
    });

    router.post('/mkdir', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        const path = req.body.path;
        const folderName = req.body.folderName;
        if (!path || !folderName) {
            res.status(400).json({
                message: 'No path or folder specified',
                error: 'No path or folder specified'
            });
            return;
        }

        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(async () => {
            const result = await client.mkdir(path + '/' + folderName);
            res.json({
                message: 'Folder created',
                data: result
            });
        }).catch((err: Error) => {
            res.status(500).json({
                message: 'Error creating folder',
                error: err
            });
        }).finally(() => {
            client.end().catch(e => {});
        })
    });

    router.post('/upload', [AuthenticationMiddleware, upload.single('file')], async (req: Request, res: Response) => {
        const path = req.body.path;
        const fileName = req.body.fileName;
        const file = req.file;

        if (!path || !file || !fileName) {
            res.json({
                message: 'No path, file or filename specified',
                error: 'No path, file or filename specified'
            });
            return;
        }
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(async () => {
            client.put(file.path, path + '/' + fileName)
                .then((ret: string) => {
                    res.json({
                        message: 'File uploaded',
                        data: {
                            path: path + '/' + fileName,
                            message: ret
                        }
                    });
                }
                ).catch((err: Error) => {
                    res.status(500).json({
                        message: 'Error uploading file',
                        error: err
                    });
                }).finally(() => {
                    // Delete the file
                    fs.unlinkSync(file.path);
                    client.end().catch(e => {});
                });
        }).catch((err: Error) => {
            res.status(500).json({
                message: 'Error uploading file',
                error: err
            });
        });
    });

    router.get('/download', [AuthenticationMiddleware], async (req: Request, res: Response) => {
        const path: string = typeof req.query.path === 'string' ? req.query?.path : undefined;
        const fileName: string = typeof req.query.fileName === 'string' ? req.query?.fileName : undefined;
        if (!path || !fileName) {
            res.status(400).json({
                message: 'No path or file specified',
                error: 'No path or file specified'
            });
            return;
        }
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(async () => {
            client.get(path + '/' + fileName, res.attachment(fileName), {
                readStreamOptions: {
                    flags: 'r',
                    encoding: null,
                    mode: 0o666,
                    autoClose: true
                },
                pipeOptions: {
                    end: true,
                }
            }).then(() => {
                client.end().catch(e => {});
            })
        }).catch((err: Error) => {
            res.status(500).json({
                message: 'Error downloading file',
                error: err
            });
        });
    });

    return router;
}

export default SFTPClient;