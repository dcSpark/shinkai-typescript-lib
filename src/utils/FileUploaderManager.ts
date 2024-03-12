import { blake3 } from "@noble/hashes/blake3";
import { urlJoin } from "../utils/url-join";
import { InboxName } from "../schemas/inbox_name";
import { hexToBytes } from "../cryptography/crypto_utils";
import { ShinkaiMessageBuilder } from "../shinkai_message_builder/shinkai_message_builder";
import { ICryptoService, IHttpService } from "./FileUploaderInterfaces";

// Conditional FormData implementation
interface IFormData {
  append(name: string, value: any, fileName?: string): void;
}

// Conditional FormData implementation
let FormDataImplementation: { new (): IFormData };
if (typeof window === "undefined") {
  // We are in a Node.js environment
  FormDataImplementation = require("form-data") as unknown as {
    new (): IFormData;
  };
} else {
  // We are in a web browser environment
  FormDataImplementation = FormData as unknown as { new (): IFormData };
}

function createFormData(): IFormData {
  return new FormDataImplementation();
}

function appendFile(
  formData: IFormData,
  fieldName: string,
  file: any,
  fileName: string
) {
  // Convert ArrayBuffer to Buffer in Node.js environment
  if (typeof window === "undefined" && file instanceof ArrayBuffer) {
    file = Buffer.from(file);
  }
  formData.append(fieldName, file, fileName);
}

export class FileUploader {
  private httpService: IHttpService;
  private cryptoService: ICryptoService;

  private base_url: string;
  private my_encryption_secret_key: string;
  private my_signature_secret_key: string;
  private receiver_public_key: string;
  private sender: string;
  private sender_subidentity: string;
  private receiver: string;
  private symmetric_key: CryptoKey | null;
  private folder_id: string | null;

  constructor(
    httpService: IHttpService,
    cryptoService: ICryptoService,
    base_url: string,
    my_encryption_secret_key: string,
    my_signature_secret_key: string,
    receiver_public_key: string,
    sender: string,
    sender_subidentity: string,
    receiver: string
  ) {
    this.httpService = httpService;
    this.cryptoService = cryptoService;
    this.base_url = base_url;
    this.my_encryption_secret_key = my_encryption_secret_key;
    this.my_signature_secret_key = my_signature_secret_key;
    this.receiver_public_key = receiver_public_key;

    this.sender = sender;
    this.sender_subidentity = sender_subidentity;
    this.receiver = receiver;
    this.symmetric_key = null;
    this.folder_id = null;
  }

  async calculateHashFromSymmetricKey(): Promise<string> {
    if (!this.symmetric_key) {
      throw new Error("Symmetric key is not set");
    }

    const rawKey = await this.cryptoService.subtle.exportKey(
      "raw",
      this.symmetric_key
    );
    const rawKeyArray = new Uint8Array(rawKey);
    const keyHexString = Array.from(rawKeyArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const hash = blake3(keyHexString);
    const hashHex = Array.from(hash)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  }

  async generateAndUpdateSymmetricKey(): Promise<void> {
    const keyData = this.cryptoService.getRandomValues(new Uint8Array(32));
    this.symmetric_key = await this.cryptoService.subtle.importKey(
      "raw",
      keyData,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
  }

  async createFolder(): Promise<string> {
    try {
      const keyData = this.cryptoService.getRandomValues(new Uint8Array(32));
      this.symmetric_key = await this.cryptoService.subtle.importKey(
        "raw",
        keyData,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
      );

      const exportedKey = await this.cryptoService.subtle.exportKey(
        "raw",
        this.symmetric_key
      );
      const exportedKeyArray = new Uint8Array(exportedKey);
      const exportedKeyString = Array.from(exportedKeyArray)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const hash = await this.calculateHashFromSymmetricKey();
      const message = await ShinkaiMessageBuilder.createFilesInboxWithSymKey(
        hexToBytes(this.my_encryption_secret_key),
        hexToBytes(this.my_signature_secret_key),
        hexToBytes(this.receiver_public_key),
        exportedKeyString,
        this.sender,
        this.sender_subidentity,
        this.receiver
      );

      const response = await this.httpService.fetch(
        urlJoin(this.base_url, "/v1/create_files_inbox_with_symmetric_key"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.folder_id = hash;
      return this.folder_id;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async uploadEncryptedFileWeb(file: File, filename?: string): Promise<void> {
    const fileData = await file.arrayBuffer();
    return this.uploadEncryptedData(fileData, filename || file.name);
  }

  // Method for uploading files in a Node.js environment
  async uploadEncryptedFileNode(
    buffer: Buffer,
    filename: string
  ): Promise<void> {
    return this.uploadEncryptedData(buffer, filename);
  }

  private async uploadEncryptedData(
    data: ArrayBuffer | Buffer,
    filename: string
  ): Promise<void> {
    if (!this.symmetric_key) {
      throw new Error("Symmetric key is not set");
    }

    // Generate the initialization vector (iv) here
    const iv = this.cryptoService.getRandomValues(new Uint8Array(12));
    const algorithm = { name: "AES-GCM", iv };

    // Perform encryption
    const encryptedFileData = await this.cryptoService.subtle.encrypt(
      algorithm,
      this.symmetric_key, // symmetric_key is guaranteed to be non-null here
      data
    );

    const hash = await this.calculateHashFromSymmetricKey();
    const nonce = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const formData = createFormData();
    // Adjust for environment differences
    let fileData;
    if (typeof window === "undefined") {
      // In Node.js, directly use Buffer
      fileData = Buffer.from(encryptedFileData);
    } else {
      // In the browser, use Blob
      fileData = new Blob([encryptedFileData]);
    }
    appendFile(formData, "file", fileData, filename);

    await this.httpService.fetch(
      urlJoin(
        this.base_url,
        "/v1/add_file_to_inbox_with_symmetric_key",
        hash,
        nonce
      ),
      {
        method: "POST",
        body: formData,
      }
    );
  }
}
