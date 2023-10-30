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

  test("decrypt provided encrypted message", async () => {
    const encryptedMessage = "encrypted:597acb94d1af8144f4ac332937a41e217c6dd9e70dda9c584f976151b2f590cf6001ddeed6d43fe5741bf9481bd572c26b42fe8791c19431f3104cd407d9cfda2e499060ca85b4ec4b33efc2fa2f6bb1e07e38ae2798f76b5f085f6751c07175f805b84a3ada42f12e89b297d19452a5619a4445da84472a6747712aa477adf5792fbe3848e0c8fcbb7e892a843bf13582a0cb0aba6c0869cb493a197201120450c87bd7f06b34872cd53ab1adea3ca0c7c07657981dd96e921c9d563f867fe68ce776cbadec3d5853c19664354461184357d304557da1aa8a7ccf96fe2d21be90428438bf4ccaf95f8aabd90faf00007ba7acaab5cc867756517284d709d18bc0d47da2a8fd4875d3671729d1107be666ee66739f27d98f45f31f9b954ef39fb88e49a6f94b625a2f97e09c8a4023d24a29e17b024d28ce4ef8cc7a714ee23a6ff468ccaa99b107b289b6c54e0286825538c8f2d61cb0f8071aabcb576057aea3f0c3f1bc3a4427b33fb92f16290b7515014b5bfe80a6f33e894516bf0bcbfcd920ecb20c5271af385bb6943703fcd77033d95ad4bd925238062a32ceeb9ec0352f852d37054eb4836f82fbdf0bb338deb0275fcb686f84f761c1adc07ef6e2c2f09fffa1c39f1b548406";
    const myEncryptionSecretKey = "e82bd03bf86b935fa34d71ad7ebb049f1f10f87d343e521511d8f9e66256204d";
    const receiverPublicKey = "912fed05e286af45f44580d6a87da61e1f9a0946237dd29f7bc2d3cbeba0857f";
  
    // Convert keys from HexString to Uint8Array
    const myPrivateKey = hexToBytes(myEncryptionSecretKey);
    const recipientPublicKey = hexToBytes(receiverPublicKey);
  
    // Decrypt the message
    const decryptedMessage = await decryptMessage(
      encryptedMessage,
      myPrivateKey,
      recipientPublicKey
    );
  
    console.log(decryptedMessage);
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
