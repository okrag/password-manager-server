import { readFile, writeFile } from "fs/promises";
import AES from "crypto-js/aes";
import utf8 from "crypto-js/enc-utf8";

export class JsonFile {
  constructor(private filepath: string, private encryption: boolean) {}

  public async get<ReturnType = any>(passphrase?: string): Promise<ReturnType> {
    let fileContent = (await readFile(this.filepath)).toString();
    if (this.encryption) {
      fileContent = AES.decrypt(fileContent, passphrase ?? "").toString(utf8);
    }
    return JSON.parse(fileContent);
  }
  public async set(value: any, passphrase?: string) {
    let stringified = JSON.stringify(value);
    if (this.encryption) {
      stringified = AES.encrypt(stringified, passphrase ?? "").toString();
    }
    await writeFile(this.filepath, stringified);
  }
}
