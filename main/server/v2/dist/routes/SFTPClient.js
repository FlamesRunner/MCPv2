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
const auth_1 = __importDefault(require("../utils/auth"));
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
const getClient = (req) => {
    const client = new ssh2_sftp_client_1.default();
    return {
        sftpWrapper: client.connect({
            host: req.body.host || req.query.host,
            username: req.body.username || req.query.username,
            password: req.body.password || req.query.password,
            port: 22,
            readyTimeout: 5000
        }), client: client
    };
};
const SFTPClient = () => {
    const upload = (0, multer_1.default)({ dest: 'uploads/', limits: { fileSize: 2147483648 } });
    router.all('/', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.json({
            message: 'MCPv2 SFTP Client API, at your service!',
        });
    }));
    router.post('/ls', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const path = req.body.path || '/';
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(() => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield client.list(path);
            res.json({
                message: 'Listing files',
                data: result
            });
        })).catch((err) => {
            res.status(500).json({
                message: 'Error listing files',
                error: err
            });
        }).finally(() => {
            client.end().catch(e => { });
        });
    }));
    router.post('/rm', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const path = req.body.path;
        if (!path) {
            res.status(400).json({
                message: 'No path specified',
                error: 'No path specified'
            });
            return;
        }
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(() => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield client.delete(path);
            res.json({
                message: 'File removed',
                data: result
            });
        })).catch((err) => {
            res.status(500).json({
                message: 'Error listing files',
                error: err
            });
        }).finally(() => {
            client.end().catch(e => { });
        });
    }));
    router.post('/mkdir', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        sftpWrapper.then(() => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield client.mkdir(path + '/' + folderName);
            res.json({
                message: 'Folder created',
                data: result
            });
        })).catch((err) => {
            res.status(500).json({
                message: 'Error creating folder',
                error: err
            });
        }).finally(() => {
            client.end().catch(e => { });
        });
    }));
    router.post('/upload', [auth_1.default, upload.single('file')], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        sftpWrapper.then(() => __awaiter(void 0, void 0, void 0, function* () {
            client.put(file.path, path + '/' + fileName)
                .then((ret) => {
                res.json({
                    message: 'File uploaded',
                    data: {
                        path: path + '/' + fileName,
                        message: ret
                    }
                });
            }).catch((err) => {
                res.status(500).json({
                    message: 'Error uploading file',
                    error: err
                });
            }).finally(() => {
                // Delete the file
                fs_1.default.unlinkSync(file.path);
                client.end().catch(e => { });
            });
        })).catch((err) => {
            res.status(500).json({
                message: 'Error uploading file',
                error: err
            });
        });
    }));
    router.get('/download', [auth_1.default], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const path = typeof req.query.path === 'string' ? (_a = req.query) === null || _a === void 0 ? void 0 : _a.path : undefined;
        const fileName = typeof req.query.fileName === 'string' ? (_b = req.query) === null || _b === void 0 ? void 0 : _b.fileName : undefined;
        if (!path || !fileName) {
            res.status(400).json({
                message: 'No path or file specified',
                error: 'No path or file specified'
            });
            return;
        }
        const { client, sftpWrapper } = getClient(req);
        sftpWrapper.then(() => __awaiter(void 0, void 0, void 0, function* () {
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
                client.end().catch(e => { });
            });
        })).catch((err) => {
            res.status(500).json({
                message: 'Error downloading file',
                error: err
            });
        });
    }));
    return router;
};
exports.default = SFTPClient;
//# sourceMappingURL=SFTPClient.js.map