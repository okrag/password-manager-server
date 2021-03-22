import { Request as ExpressRequest } from "express";

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Session {
  sessionId: string;
  clientId: string;
  token: string;
  expiresIn: number;
}

export interface Request extends ExpressRequest {
  clientId?: string;
  session?: Session;
}
