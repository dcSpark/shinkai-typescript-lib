import { blake3 } from "@noble/hashes/blake3";
import { urlJoin } from "../utils/url-join";
import { InboxName } from "../schemas/inbox_name";
import { hexToBytes } from "../cryptography/crypto_utils";
import { ShinkaiMessageBuilder } from "../shinkai_message_builder/shinkai_message_builder";

export class FileUploader {
  private base_url: string;
  private my_encryption_secret_key: string;
  private my_signature_secret_key: string;
  private receiver_public_key: string;
  private sender: string;
  private sender_subidentity: string;
  private receiver: string;
  private job_id: string;
  private job_inbox: string;
  private symmetric_key: CryptoKey | null;
  private folder_id: string | null;

  constructor(
    base_url: string,
    my_encryption_secret_key: string,
    my_signature_secret_key: string,
    receiver_public_key: string,
    job_inbox: string,
    sender: string,
    sender_subidentity: string,
    receiver: string
  ) {
    this.base_url = base_url;
    this.my_encryption_secret_key = my_encryption_secret_key;
    this.my_signature_secret_key = my_signature_secret_key;
    this.receiver_public_key = receiver_public_key;

    const inbox = InboxName.fromString(job_inbox);
    this.job_id = inbox.getUniqueId();
    this.job_inbox = job_inbox;
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

    const rawKey = await window.crypto.subtle.exportKey(
      "raw",
      this.symmetric_key
    );

    const rawKeyArray = new Uint8Array(rawKey);
    const hash = blake3(rawKeyArray);
    const hashHex = Array.from(hash)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  }

  async createFolder(): Promise<string> {
    try {
      const keyData = window.crypto.getRandomValues(new Uint8Array(32));
      this.symmetric_key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
      );

      // Export symmetric key
      const exportedKey = await window.crypto.subtle.exportKey(
        "raw",
        this.symmetric_key
      );
      const exportedKeyArray = new Uint8Array(exportedKey);
      const exportedKeyString = Array.from(exportedKeyArray)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const message =
        await ShinkaiMessageBuilder.createFilesInboxWithSymKey(
          hexToBytes(this.my_encryption_secret_key),
          hexToBytes(this.my_signature_secret_key),
          hexToBytes(this.receiver_public_key),
          this.job_inbox,
          exportedKeyString,
          this.sender,
          this.sender_subidentity,
          this.receiver
        );

      const response = await fetch(
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
      this.folder_id = await this.calculateHashFromSymmetricKey();
      return response.text();
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async uploadEncryptedFile(file: File, filename?: string): Promise<void> {
    if (!this.symmetric_key) {
      throw new Error("Symmetric key is not set");
    }

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const algorithm = {
        name: "AES-GCM",
        iv,
      };
      const fileData = await file.arrayBuffer();
      const encryptedFileData = await window.crypto.subtle.encrypt(
        algorithm,
        this.symmetric_key,
        fileData
      );

      const hash = await this.calculateHashFromSymmetricKey();
      const nonce = Array.from(iv)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([encryptedFileData]),
        filename || file.name
      );

      await fetch(
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
    } catch (error) {
      console.error("Error uploading encrypted file:", error);
      throw error;
    }
  }

  async finalizeAndSend(
    content: string,
    parent: string | null
  ): Promise<string> {
    try {
      const message = await ShinkaiMessageBuilder.jobMessage(
        this.job_id,
        content,
        this.folder_id || "",
        parent,
        hexToBytes(this.my_encryption_secret_key),
        hexToBytes(this.my_signature_secret_key),
        hexToBytes(this.receiver_public_key),
        this.sender,
        this.sender_subidentity,
        this.receiver,
        this.sender_subidentity
      );

      const response = await fetch(urlJoin(this.base_url, "/v1/job_message"), {
        method: "POST",
        body: JSON.stringify(message),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    } catch (error) {
      console.error("Error finalizing and sending:", error);
      throw error;
    }
  }
}
