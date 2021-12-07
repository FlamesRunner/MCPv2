import { ObjectId } from "mongoose";

interface IAuthData {
    username: string;
    email: string;
    expiresOn: number;
    role: string;
    _id: ObjectId;
}

export default IAuthData;