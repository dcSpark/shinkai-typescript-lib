import {
  generateEncryptionKeys,
  generateSignatureKeys,
} from "../src/cryptography/shinkai_encryption";
import { JobScope, MessageSchemaType } from "../src/schemas/schema_types";
import { EncryptedMessageBody, UnencryptedMessageBody } from "../src/shinkai_message/shinkai_message_body";
import {
  ShinkaiMessageBuilder,
  EncryptionStaticKey,
  SignatureStaticKey,
  EncryptionPublicKey,
} from "../src/shinkai_message_builder/shinkai_message_builder";

describe("ShinkaiMessageBuilder", () => {
  it("should create an ACK message", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";

    const message = await ShinkaiMessageBuilder.ackMessage(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      sender,
      receiver
    );

    if (message.body instanceof UnencryptedMessageBody) {
      const messageData = message.body.unencrypted.message_data;
      if ("unencrypted" in messageData) {
        expect(messageData.unencrypted.message_raw_content).toBe("ACK");
      } else {
        throw new Error("Message data is not unencrypted");
      }
    } else {
      throw new Error("Message body is not unencrypted");
    }
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });

  it("should create a TERMINATE message", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";

    const message = await ShinkaiMessageBuilder.terminateMessage(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      sender,
      receiver
    );

    if (message.body instanceof UnencryptedMessageBody) {
      const messageData = message.body.unencrypted.message_data;
      if ("unencrypted" in messageData) {
        expect(messageData.unencrypted.message_raw_content).toBe("terminate");
      } else {
        throw new Error("Message data is not unencrypted");
      }
    } else {
      throw new Error("Message body is not unencrypted");
    }
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });

  it("should create a Job Creation message", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const node_receiver_subidentity = "node_receiver_subidentity";
    const scope: JobScope = {
      buckets: ["bucket1", "bucket2"],
      documents: ["document1", "document2"],
    };

    const message = await ShinkaiMessageBuilder.jobCreation(
      scope,
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      sender,
      sender_subidentity,
      receiver,
      node_receiver_subidentity
    );
    
    // Check if the message body is an instance of EncryptedMessageBody
    if (message.body instanceof EncryptedMessageBody) {
      // You can add your assertions here related to the encrypted message
      // For example, you might want to check if the content is not empty
      expect(message.body.encrypted.content).not.toBe("");
    } else {
      throw new Error("Message body is not encrypted");
    }
  
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });

  it("should create a custom Shinkai message to node", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();
  
    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const data = {
      key1: "value1",
      key2: "value2",
    };
  
    const message = await ShinkaiMessageBuilder.createCustomShinkaiMessageToNode(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      data,
      sender_subidentity,
      sender,
      receiver,
      MessageSchemaType.TextContent
    );
  
    // Check if the message body is an instance of EncryptedMessageBody
    if (message.body instanceof EncryptedMessageBody) {
      // You can add your assertions here related to the encrypted message
      // For example, you might want to check if the content is not empty
      expect(message.body.encrypted.content).not.toBe("");
    } else {
      throw new Error("Message body is not encrypted");
    }
  
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });

  it("should create a custom Shinkai message for profile registration", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();
  
    const profile_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const profile_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const code = "registration_code";
    const identity_type = "identity_type";
    const permission_type = "permission_type";
    const registration_name = "registration_name";
  
    const message = await ShinkaiMessageBuilder.useCodeRegistrationForProfile(
      profile_encryption_sk,
      profile_signature_sk,
      receiver_public_key,
      code,
      identity_type,
      permission_type,
      registration_name,
      sender_subidentity,
      sender,
      receiver
    );
  
    // Check if the message body is an instance of EncryptedMessageBody
    if (message.body instanceof EncryptedMessageBody) {
      // You can add your assertions here related to the encrypted message
      // For example, you might want to check if the content is not empty
      expect(message.body.encrypted.content).not.toBe("");
    } else {
      throw new Error("Message body is not encrypted");
    }
  
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });
});
