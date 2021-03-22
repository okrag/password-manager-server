import { Router } from "express";
import { join } from "path";
import { checkAuth } from "./auth";
import { JsonFile } from "./JsonFile";
import { Password, Request } from "./types";
import { checkString } from "./utils";
import { v4 as uuid } from "uuid";

export const router = Router();

const getFile = (id: string) =>
  new JsonFile<Password[]>(join(__dirname, "../db/passwords/", id + ".json"), true, []);

router.get("/passwords", checkAuth, async (req: Request, res) => {
  const { passphrase } = req.body;
  if (!checkString(passphrase)) {
    return res.status(400).send({ success: false, message: "Passphrase required!" });
  }
  const file = getFile(req.clientId ?? "");
  if (req.body.site) {
    return res.send({
      success: true,
      passwords: (await file.get(passphrase)).filter((value) => value.site === req.body.site),
    });
  }
  res.send({ success: true, passwords: await file.get(passphrase) });
});
// new password
router.post("/password", checkAuth, async (req: Request, res) => {
  const { site, username, password, passphrase } = req.body;
  if (!checkString(site, username, password, passphrase)) {
    return res
      .status(400)
      .send({ success: false, message: "Passphrase, username, sites and password required!" });
  }
  const file = getFile(req.clientId ?? "");
  const pass: Password = {
    id: uuid(),
    site,
    password,
    username,
  };
  file.set([...(await file.get(passphrase)), pass], passphrase);
  res.send({ success: true, password: pass });
});
// update existing password
router.put("/password", checkAuth, async (req: Request, res) => {
  const { id, passphrase, site, password, username } = req.body;
  if (!checkString(id, passphrase)) {
    return res.status(400).send({ success: false, message: "Passphrase and id required!" });
  }
  const file = getFile(req.clientId ?? "");

  const toUpdate: Partial<Password> = {};
  if (checkString(password)) toUpdate.password = password;
  if (checkString(site)) toUpdate.site = site;
  if (checkString(username)) toUpdate.username = username;

  await file.set(
    (await file.get(passphrase)).map((v) => (v.id === id ? { ...v, ...toUpdate } : v)),
    passphrase,
  );

  res.send({ success: true });
});
