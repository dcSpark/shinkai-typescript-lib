// tests/crypto.test.ts
import { hexToBytes } from "../src/cryptography/crypto_utils";
import {
  decryptMessage,
  decryptMessageWithPassphrase,
  encryptMessage,
  encryptMessageWithPassphrase,
  generateEncryptionKeys,
  generateSignatureKeys,
} from "../src/cryptography/shinkai_encryption";
import { Crypto } from "@peculiar/webcrypto";
import sodium from "libsodium-wrappers-sumo";
import { ShinkaiMessage } from "../src/shinkai_message/shinkai_message";
import {
  sign_outer_layer,
  verify_outer_layer_signature,
} from "../src/cryptography/shinkai_signing";

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

  test("sign and verify outer layer signature", async () => {
    const unsorted_messageJson = `{
        "body": {
            "unencrypted": {
                "message_data": {
                    "unencrypted": {
                        "message_content_schema": "TextContent",
                        "message_raw_content": "hey!"
                    }
                },
                "internal_metadata": {
                    "inbox": "inbox::@@node1.shinkai/main/device/main_device::@@node2.shinkai::false",
                    "sender_subidentity": "main/device/main_device",
                    "encryption": "None",
                    "recipient_subidentity": "",
                    "signature": "c6d0115c0878fbf2279f98aab67c0e9cb1af63825f49dca48d6e4420eba0ceb973e00488ba0905c9afd09254f0dac48c468fdcb1d6c5ab5ca4c5dd70a440b903"
                }
                
            }
        },
        "external_metadata": {
            "recipient": "@@node2.shinkai",
            "other": "",
            "sender": "@@node1.shinkai",
            "scheduled_time": "2023-08-25T22:44:01.132Z",
            "intra_sender": "intra_sender",
            "signature": "d7d0115c0878fbf2279f98aab67c0e9cb1af63825f49dca48d6e4420eba0ceb973e00488ba0905c9afd09254f0dac48c468fdcb1d6c5ab5ca4c5dd70a389f123"
        },
        "encryption": "DiffieHellmanChaChaPoly1305",
        "version": "V1_0"
      }`;

    const keys = await generateSignatureKeys();

    // Convert keys from HexString to Uint8Array
    const privateKey = hexToBytes(keys.my_identity_sk_string);
    const publicKey = hexToBytes(keys.my_identity_pk_string);

    // Parse the message JSON to a ShinkaiMessage object
    const shinkaiMessage: ShinkaiMessage = JSON.parse(unsorted_messageJson);

    // Sign the message
    const signedMessage = await sign_outer_layer(privateKey, shinkaiMessage);

    // Overwrite the signature in shinkaiMessage with the one from signedMessage
    shinkaiMessage.external_metadata.signature = signedMessage.signature;

    // Verify the signature
    const isValid = await verify_outer_layer_signature(
      publicKey,
      shinkaiMessage
    );

    // The signature should be valid
    expect(isValid).toBe(true);
  });
});
