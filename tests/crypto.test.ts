// tests/crypto.test.ts
import { hexToBytes } from "../src/cryptography/crypto_utils";
import {
  decryptMessage,
  decryptMessageWithPassphrase,
  encryptMessage,
  encryptMessageWithPassphrase,
  generateEncryptionKeys,
} from "../src/cryptography/shinkai_encryption";
import { Crypto } from "@peculiar/webcrypto";
import sodium from "libsodium-wrappers-sumo";

const crypto = new Crypto();
globalThis.crypto = crypto;

describe("Cryptography Functions", () => {
  test("encrypt and decrypt message using keys", async () => {
    const originalMessage = "Hello, world!";
    const senderKeys = await generateEncryptionKeys();
    const recipientKeys = await generateEncryptionKeys();

    // Convert keys from HexString to Uint8Array
    const senderPrivateKey = hexToBytes(senderKeys.my_encryption_sk_string);
    const senderPublicKey = hexToBytes(senderKeys.my_encryption_pk_string);
    const recipientPrivateKey = hexToBytes(
      recipientKeys.my_encryption_sk_string
    );
    const recipientPublicKey = hexToBytes(
      recipientKeys.my_encryption_pk_string
    );

    // Encrypt the message
    const encryptedMessage = await encryptMessage(
      originalMessage,
      senderPrivateKey,
      recipientPublicKey
    );

    // Decrypt the message
    const decryptedMessage = await decryptMessage(
      encryptedMessage,
      recipientPrivateKey,
      senderPublicKey
    );

    // The decrypted message should be the same as the original message
    expect(decryptedMessage).toBe(originalMessage);
  });

  test("encrypt and decrypt message with passphrase", async () => {
    await sodium.ready; // Ensure sodium is fully loaded

    const originalMessage = "Hello, world!";
    const passphrase = "my secret passphrase";

    // Encrypt the message
    const encryptedMessage = await encryptMessageWithPassphrase(
      originalMessage,
      passphrase
    );

    // Decrypt the message
    const decryptedMessage = await decryptMessageWithPassphrase(
      encryptedMessage,
      passphrase
    );

    // The decrypted message should be the same as the original message
    expect(decryptedMessage).toBe(originalMessage);
  });
});
