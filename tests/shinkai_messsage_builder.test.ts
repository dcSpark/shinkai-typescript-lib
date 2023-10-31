import { generateEncryptionKeys, generateSignatureKeys } from "../src/cryptography/shinkai_encryption";
import { UnencryptedMessageBody } from "../src/shinkai_message/shinkai_message_body";
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
    const sender = "sender";
    const receiver = "receiver";

    const message = await ShinkaiMessageBuilder.ackMessage(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      sender,
      receiver
    );

    if (message.body instanceof UnencryptedMessageBody) {
        const messageData = message.body.unencrypted.message_data;
        if ('unencrypted' in messageData) {
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
});
