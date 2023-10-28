import { MessageSchemaType, TSEncryptionMethod } from "../schemas/schema_types";
import { ExternalMetadata } from "./shinkai_external_metadata";
import { EncryptedMessageBody, MessageBody } from "./shinkai_message_body";

export class ShinkaiMessage {
  body: MessageBody;
  external_metadata: ExternalMetadata;
  encryption: keyof typeof TSEncryptionMethod;

  constructor(body: MessageBody, external_metadata: ExternalMetadata, encryption: keyof typeof TSEncryptionMethod) {
    this.body = body;
    this.external_metadata = external_metadata;
    this.encryption = encryption;
  }

  async encrypt_outer_layer(self_sk: Uint8Array, destination_pk: Uint8Array): Promise<ShinkaiMessage> {
    if (this.body instanceof EncryptedMessageBody) {
      throw new Error('Message body is already encrypted');
    }

    if (this.encryption === TSEncryptionMethod.None) {
      throw new Error('Message encryption method is None');
    }

    const message_clone = new ShinkaiMessage(this.body, this.external_metadata, this.encryption);
    message_clone.body = await this.body.encrypt(self_sk, destination_pk);
    message_clone.encryption = TSEncryptionMethod.DiffieHellmanChaChaPoly1305;
    return message_clone;
  }
}
