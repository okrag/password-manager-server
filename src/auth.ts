import { NextFunction, Response, Router } from "express";
import { Request, Scanner, Session, User } from "./types";
import HMAC from "crypto-js/hmac-sha512";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { JsonFile } from "./JsonFile";
import { join } from "path";
import { v4 as uuid } from "uuid";
import { checkString } from "./utils";

const users = new JsonFile<User[]>(
  join(__dirname, "../db/users.json"),
  false,
  null,
  join(__dirname, "../db_defaults/users.json"),
);
const sessions = new JsonFile<Session[]>(join(__dirname, "../db/sessions.json"), false, []);
const scanners = new JsonFile<Scanner[]>(join(__dirname, "../db/scanners.json"), false, []);

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization?.split(" ") ?? ["", ""];
  if (authorization[0] !== "Bearer") {
    return res.status(403).send({
      success: false,
      message: "Forbidden",
    });
  }

  req.clientId = await checkToken(authorization[1]);
  if (!req.clientId) {
    return res.status(403).send({
      success: false,
      message: "Forbidden",
    });
  }
  return next();
};

export const checkToken = async (token: string | undefined): Promise<string> => {
  const splittedToken = token?.split(":") ?? ["", ""];
  if (splittedToken.length !== 2) {
    return "";
  }
  const correctSignature = HMAC(
    splittedToken[0],
    process.env.SESSION_SECRET ?? "secret",
  ).toString();
  if (correctSignature !== splittedToken[1]) {
    return "";
  }
  const decodedToken = Buffer.from(splittedToken[0], "base64").toString();
  const session = (await sessions.get()).find(({ token }) => token === decodedToken);
  if (!session) {
    return "";
  }

  if (session.expiresIn !== 0 && session.expiresIn < Date.now()) {
    await sessions.set(
      (await sessions.get()).filter(({ sessionId }) => sessionId !== session.sessionId),
    );
    return "";
  }

  return session.clientId;
};

export const checkScannerToken = async (token: string): Promise<string> => {
  const splittedToken = token?.split(".") ?? ["", ""];
  if (splittedToken.length !== 2) {
    return "";
  }
  const correctSignature = HMAC(
    splittedToken[0],
    process.env.SESSION_SECRET ?? "secret",
  ).toString();
  if (correctSignature !== splittedToken[1]) {
    return "";
  }
  const decodedToken = Buffer.from(splittedToken[0], "base64").toString();
  const scanner = (await scanners.get()).find(({ token }) => token === decodedToken);
  if (!scanner) {
    return "";
  }

  return scanner.clientId;
};

export const generateToken = (id: string): string => {
  const token = randomBytes(16).toString("hex") + id;
  const base64Token = Buffer.from(token).toString("base64");
  const signature = HMAC(base64Token, process.env.SESSION_SECRET ?? "secret");
  return base64Token + ":" + signature;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  return (await users.get()).find((user) => user.id === id);
};
export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  return (await users.get()).find((user) => user.username === username);
};

export const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!checkString(username, password)) {
    return res.status(400).send({
      success: false,
      message: "Username and password required!",
    });
  }
  const user = await getUserByUsername(username);
  if (!user) {
    return res.status(400).send({
      success: false,
      message: "Username or password are incorrect!",
    });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).send({
      success: false,
      message: "Username or password are incorrect!",
    });
  }

  const sessionId = uuid();
  const token = generateToken(user.id);

  await sessions.set([
    ...(await sessions.get()),
    {
      clientId: user.id,
      sessionId,
      token: token.split(":")[0],
      expiresIn: 1000 * 60 * 60 * 24 * 30 + Date.now(),
    },
  ]);

  res.status(200).send({ success: true, token });
});

router.post("/register", checkAuth, async (req, res) => {
  const { username, password } = req.body;
  if (!checkString(username, password)) {
    return res.status(400).send({
      success: false,
      message: "Username and password required!",
    });
  }
  if (username.length < 3) {
    return res.status(400).send({
      success: false,
      message: "Username must have at least 3 characters!",
    });
  }
  if (username.length > 50) {
    return res.status(400).send({
      success: false,
      message: "Username can't have more than 50 characters!",
    });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await users.set([
    ...(await users.get()),
    {
      id: uuid(),
      password: hashedPassword,
      username,
    },
  ]);
  res.send({ success: true });
});

router.post("/registerScanner", checkAuth, async (req: Request, res) => {
  const token = generateToken(req.clientId ?? "");
  await scanners.set([
    ...(await scanners.get()),
    { token, clientId: req.clientId ?? "", id: uuid() },
  ]);
  res.send({ success: true, token });
});
