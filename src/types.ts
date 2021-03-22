import { Request as ExpressRequest } from "express";

export interface Password {
  id: string;
  site: string;
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
}
export interface Scanner {
  id: string;
  token: string;
  clientId: string;
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
