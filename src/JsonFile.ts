import { readFile, writeFile, access } from "fs/promises";
import AES from "crypto-js/aes";
import utf8 from "crypto-js/enc-utf8";

const CACHE_TIME = 1000 * 60 * 10;

export class JsonFile<DataType = any> {
  private lastUpdate: number = 0;
  private cache: DataType = {} as any;

  constructor(
    private filepath: string,
    private encryption: boolean,
    defaultValue: DataType | null,
    startupFilepath?: string,
  ) {
    if (!encryption)
      access(this.filepath).catch(() => {
        if (startupFilepath) {
          readFile(startupFilepath).then((value) => {
            writeFile(this.filepath, value.toString());
          });
        } else {
          writeFile(this.filepath, JSON.stringify(defaultValue));
        }
      });
  }

  public async get(passphrase?: string): Promise<DataType> {
    if (Date.now() - this.lastUpdate >= CACHE_TIME) {
      let fileContent = (await readFile(this.filepath)).toString();
      if (this.encryption) {
        fileContent = AES.decrypt(fileContent, passphrase ?? "").toString(utf8);
      }
      this.lastUpdate = Date.now();
      this.cache = JSON.parse(fileContent);
      return this.cache;
    }
    return this.cache;
  }

  public async set(value: DataType, passphrase?: string) {
    let stringified = JSON.stringify(value);
    if (this.encryption) {
      stringified = AES.encrypt(stringified, passphrase ?? "").toString();
    }
    this.cache = value;
    this.lastUpdate = Date.now();
    await writeFile(this.filepath, stringified);
  }
}
