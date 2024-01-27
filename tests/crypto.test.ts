// tests/crypto.test.ts
import { hexToBytes, toHexString } from "../src/cryptography/crypto_utils";
import {
  decryptMessageBody,
  decryptMessageData,
  decryptMessageWithPassphrase,
  encryptMessageBody,
  encryptMessageData,
  encryptMessageWithPassphrase,
  generateEncryptionKeys,
  generateSignatureKeys,
} from "../src/cryptography/shinkai_encryption";
import { Crypto } from "@peculiar/webcrypto";
import sodium from "libsodium-wrappers-sumo";
import { ShinkaiMessage } from "../src/shinkai_message/shinkai_message";
import {
  sign_inner_layer,
  sign_outer_layer,
  verify_inner_layer_signature,
  verify_outer_layer_signature,
} from "../src/cryptography/shinkai_signing";
import { MessageSchemaType } from "../src/schemas/schema_types";
import { UnencryptedMessageBody } from "../src/shinkai_message/shinkai_message_body";
import nacl from "tweetnacl";

const crypto = new Crypto();
globalThis.crypto = crypto;

describe("Cryptography Functions", () => {
  test("encrypt and decrypt message body using keys", async () => {
    const originalMessage = '{"text":"Hello, world!"}';
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
    const encryptedMessage = await encryptMessageBody(
      originalMessage,
      senderPrivateKey,
      recipientPublicKey
    );

    // Decrypt the message
    const decryptedMessage = await decryptMessageBody(
      encryptedMessage,
      recipientPrivateKey,
      senderPublicKey
    );

    // Convert the decrypted message back into a JSON string
    const decryptedMessageString = JSON.stringify(decryptedMessage);

    // The decrypted message should be the same as the original message
    expect(decryptedMessageString).toBe(originalMessage);
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

  test("decrypt provided encrypted body message", async () => {
    // Note: This is a real encrypted message from the Shinkai Node
    const encryptedMessage =
      "encrypted:cf6e0fdc56f0775188b451bbc4fa4188583c3195e16989bba7f664f83394dfe37a66104875013a5f99a4a17c2898cf12ead7f36a7eb289b70bb648f14175bde8b723e14a8fb79033076b2e9e5b987f097089c22572c80cd0cf4879a13d84b18fe894a58d55f117437ea812f5fbb5b46a467be8e668a5e6b95e6a6971643e72ff04cd88007f9b6e677debcb8474c406b8bf3ef7f6f9e1cdf6df2ee5b76bc678ffb8c7cc9de911694e3814edf5beb4bd9bd258976446bfc0038ae02bf117e5a9e6598d850782eac9024ac665b4191df513c6e9948befdaae3429e858bcfba8a0a01e64c37e2cc6ae3189e2ec632cb7f706678a2e4436b3b8c14edf1e23b512135f6768d04d4ea7df069d682b895a5abc7cf90d57dc6aaf11c920394b19d208838af3a11fc4a821752733f03b65c2552279498ab52feed614c6b5144640c680fd0570bcead01fe4c5f8c33f5f568d55050336149d5ddfc560431a6d2c80830626b84f9275ec96a75b89bc9494f5db12e7f1ea17db2a54affb0c90833901ba930e590cea56e1a7ace8270d9d3ece849cd827589626fc6bc6c260d6e74da909eb4bbc6c1da402e6c7bae780e316944adcf41c33d84b595a1df09496f4b32e5ee9af5992e187fc3fccc642a6a08d";
    const myEncryptionSecretKey =
      "e82bd03bf86b935fa34d71ad7ebb049f1f10f87d343e521511d8f9e66256204d";
    const receiverPublicKey =
      "912fed05e286af45f44580d6a87da61e1f9a0946237dd29f7bc2d3cbeba0857f";

    // Convert keys from HexString to Uint8Array
    const myPrivateKey = hexToBytes(myEncryptionSecretKey);
    const recipientPublicKey = hexToBytes(receiverPublicKey);

    // Decrypt the message
    const decryptedMessage = await decryptMessageBody(
      encryptedMessage,
      myPrivateKey,
      recipientPublicKey
    );

    // Check if the decryptedMessage is equal to the expected object
    expect(decryptedMessage).toEqual({
      message_data: {
        unencrypted: {
          message_raw_content: "Test data",
          message_content_schema: "TextContent",
        },
      },
      internal_metadata: {
        sender_subidentity: "",
        recipient_subidentity: "",
        inbox:
          "inbox::@@receiver_node.shinkai::@@receiver_node.shinkai/sender_profile::false",
        signature:
          "529fb1301b03d7813c32106c6739bb0366c3fd1a3b2a41f96f2f7a598a1d5deb9a8446b42168816a6409fbc49b474438d31a91d516e2151721d1ef0ab8363506",
        encryption: "None",
      },
    });
  });

  test("encrypt provided unencrypted body message", async () => {
    // Note: This is a real unencrypted message for the Shinkai Node
    const unencryptedMessage = {
      message_data: {
        unencrypted: {
          message_content_schema: "TextContent",
          message_raw_content: "Test data",
        },
      },
      internal_metadata: {
        sender_subidentity: "",
        recipient_subidentity: "",
        inbox:
          "inbox::@@receiver_node.shinkai::@@receiver_node.shinkai/sender_profile::false",
        signature:
          "529fb1301b03d7813c32106c6739bb0366c3fd1a3b2a41f96f2f7a598a1d5deb9a8446b42168816a6409fbc49b474438d31a91d516e2151721d1ef0ab8363506",
        encryption: "None",
      },
    };
    const myEncryptionSecretKey =
      "88b49468ed3ee4ea079f75eef9f651f09d3f18fd3a575c3c48d0052347462179";
    const receiverPublicKey =
      "60045bdb15c24b161625cf05558078208698272bfe113f792ea740dbd79f4708";

    // Convert keys from HexString to Uint8Array
    const myPrivateKey = hexToBytes(myEncryptionSecretKey);
    const recipientPublicKey = hexToBytes(receiverPublicKey);

    // Encrypt the message
    const encryptedMessage = await encryptMessageBody(
      JSON.stringify(unencryptedMessage),
      myPrivateKey,
      recipientPublicKey
    );

    // Decrypt the message
    const decryptedMessage = await decryptMessageBody(
      encryptedMessage,
      myPrivateKey,
      recipientPublicKey
    );

    // Convert the decrypted message back into a JSON string
    const decryptedMessageString = JSON.stringify(decryptedMessage);

    // The decrypted message should be the same as the original message
    expect(decryptedMessageString).toBe(JSON.stringify(unencryptedMessage));
  });

  test("decrypt provided encrypted body message (from rust node) with new data", async () => {
    const encryptedMessageJson =
      '{"body":{"encrypted":{"content":"encrypted:363800751c1ae2888de964fa8319060b6bc508257cad6898d1ab0d420aaf029af4bfb090cf87293cb8a99dbe8d835d9543ed57ec88a55b7db24748bc3c0c78ee093d1166e867df5f7b507c497fb198627cf6b6a2cff89c061c4996108bace53eb2ffc4d69781168c5cc068aaa286b5a09e1758c140ef5bc10be1d858ba3fc1139a002cab00c0da007000c220d811bb4daf3cb7b7b6f14f51c15906316229d634f2399d66d615297b52478ca79c45dbe2a669e5e76dee7f7ddf0a9a9b5b96169bbc5c29465f0f51b2502b84dcafd3597484396a584724ae00d15be3f018943ef233fca6580abf493aeb068f2fe1b61f914000b07ca5aa5f09acb28cf6ca7cd0d0dd5b0398249efb4c7fca362c910f5a9408934ceecbfb95e93251fc2b4ffc48e0557b32813bd740e2a8a6bd81f37fea63cae4696eb707ec3916d3b2046f2a2f6ae0315e443b5abebd709afb4c50f0c9272cc495e243893ed6c7cc7868c93c70b0aedb3a947e08849750df87fd0539ac0b62f1068fe491c6eab616bcc36171c53fb9b213c75100a056bb597998d06ad3716dce5e2688a3d9925ae3ab0351187de4f449390aa504ef9ef31d4e891108a9a443cfdd83d6b8c4b594aa327638198d89ba7b299c2c2f780da01bc9ba"}},"external_metadata":{"sender":"@@localhost.shinkai","recipient":"@@localhost.shinkai","scheduled_time":"2024-01-27T03:54:51.440Z","signature":"0bbaec99d5fcbdf2c669db7cd9eac55b1eb84121065779fe85469dcf7e0eec2b0094d8f8a63288a38f1cc29fc9f189e9a1e0b5f69c62ab710a27cb2aaeabfe0a","intra_sender":"main","other":""},"encryption":"DiffieHellmanChaChaPoly1305","version":"V1_0"}';
    const myEncryptionSecretKey =
      "88b49468ed3ee4ea079f75eef9f651f09d3f18fd3a575c3c48d0052347462179";
    const senderPublicKey =
      "60045bdb15c24b161625cf05558078208698272bfe113f792ea740dbd79f4708";

    // Convert keys from HexString to Uint8Array
    const myPrivateKey = hexToBytes(myEncryptionSecretKey);
    const senderPubKey = hexToBytes(senderPublicKey);

    // Parse the encrypted message JSON
    const encryptedMessageObject = JSON.parse(encryptedMessageJson);

    // Extract the encrypted content
    const encryptedContent = encryptedMessageObject.body.encrypted.content;

    // Decrypt the message
    const decryptedMessage = await decryptMessageBody(
      encryptedContent,
      myPrivateKey,
      senderPubKey
    );
    expect(typeof decryptedMessage).toBe("object");
  });

  test("encrypt provided unencrypted message data", async () => {
    // Note: This is a real unencrypted message data for the Shinkai Node
    const unencryptedMessageData = {
      message_raw_content: "Test data",
      message_content_schema: "TextContent" as MessageSchemaType,
    };
    const myEncryptionSecretKey =
      "88b49468ed3ee4ea079f75eef9f651f09d3f18fd3a575c3c48d0052347462179";
    const receiverPublicKey =
      "60045bdb15c24b161625cf05558078208698272bfe113f792ea740dbd79f4708";

    // Convert keys from HexString to Uint8Array
    const myPrivateKey = hexToBytes(myEncryptionSecretKey);
    const recipientPublicKey = hexToBytes(receiverPublicKey);

    // Encrypt the message data
    const encryptedMessageData = await encryptMessageData(
      unencryptedMessageData,
      myPrivateKey,
      recipientPublicKey
    );

    console.log("Encrypted message data:", encryptedMessageData);

    // Decrypt the message data
    const decryptedMessageData = await decryptMessageData(
      encryptedMessageData,
      myPrivateKey,
      recipientPublicKey
    );

    // The decrypted message data should be the same as the original message data
    expect(decryptedMessageData).toEqual(unencryptedMessageData);
  });

  test("decrypt provided encrypted data message", async () => {
    // Note: This is a real encrypted message from the Shinkai Node
    const encryptedMessage =
      "encrypted:11000000000000000b00000000000000105b49f6cc037679b9863a3cae6dde277e1300d29cc9cc92e3a7a1639b741facb6bb7f4b6fdb04fbbeb46d32555159f1f5dcf6268d07e9cf";
    const myEncryptionSecretKey =
      "08ad9a2f5f9418b386cce489a0bac8cb5bba34171864909e4dfec1ea4e26bf77";
    const receiverPublicKey =
      "96722725a1361f6108aa6cc967032e8dc9667b17058ca630c8861deff69b3f2f";

    // Convert keys from HexString to Uint8Array
    const myPrivateKey = hexToBytes(myEncryptionSecretKey);
    const recipientPublicKey = hexToBytes(receiverPublicKey);

    // Decrypt the message
    const decryptedMessage = await decryptMessageData(
      encryptedMessage,
      myPrivateKey,
      recipientPublicKey
    );

    // Check if the decryptedMessage is equal to the expected object
    expect(decryptedMessage).toEqual({
      message_raw_content: "test body content",
      message_content_schema: "TextContent",
    });
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
    await sign_outer_layer(privateKey, shinkaiMessage);

    // Verify the signature
    const isValid = await verify_outer_layer_signature(
      publicKey,
      shinkaiMessage
    );

    // The signature should be valid
    expect(isValid).toBe(true);
  });

  test("encrypt and decrypt message data using keys", async () => {
    const originalData = {
      message_raw_content: "Hello, world!",
      message_content_schema: "TextContent" as MessageSchemaType,
    };
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

    // Encrypt the message data
    const encryptedData = await encryptMessageData(
      originalData,
      senderPrivateKey,
      recipientPublicKey
    );

    // Decrypt the message data
    const decryptedData = await decryptMessageData(
      encryptedData,
      recipientPrivateKey,
      senderPublicKey
    );

    // The decrypted data should be the same as the original data
    expect(decryptedData).toEqual(originalData);
  });

  test("sign and verify inner layer signature", async () => {
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
          "signature": ""
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

    // Parse the JSON string to a plain object
    const messageData: any = JSON.parse(unsorted_messageJson);

    // Create a new ShinkaiMessage instance
    const shinkaiMessage = new ShinkaiMessage(
      new UnencryptedMessageBody(messageData.body.unencrypted),
      messageData.external_metadata,
      messageData.encryption,
      messageData.version
    );

    if (shinkaiMessage.body instanceof UnencryptedMessageBody) {
      // Sign the message
      await sign_inner_layer(privateKey, shinkaiMessage.body.unencrypted);

      // Verify the signature
      const isValid = await verify_inner_layer_signature(
        publicKey,
        shinkaiMessage.body.unencrypted
      );

      // The signature should be valid
      expect(isValid).toBe(true);
    } else {
      throw new Error("Message body is not unencrypted");
    }
  });

  test("check compatibility between crypto encryption libraries for key management", async () => {
    const keys = await generateEncryptionKeys();

    // Convert keys from HexString to Uint8Array
    const privateKey = hexToBytes(keys.my_encryption_sk_string);
    const originalPublicKey = hexToBytes(keys.my_encryption_pk_string);

    // Compute the public key from the private key using tweetnacl
    const computedPublicKey =
      nacl.box.keyPair.fromSecretKey(privateKey).publicKey;

    // The computed public key should be the same as the original public key
    expect(toHexString(computedPublicKey)).toBe(toHexString(originalPublicKey));
  });

  // end of describe
});
