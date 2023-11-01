import { sign_outer_layer, verify_outer_layer_signature } from "../cryptography/shinkai_signing";
import { MessageSchemaType, TSEncryptionMethod } from "../schemas/schema_types";
import { ExternalMetadata } from "./shinkai_external_metadata";
import { EncryptedMessageBody, MessageBody } from "./shinkai_message_body";
import { ShinkaiVersion } from "./shinkai_version";

export class ShinkaiMessage {
  body: MessageBody;
  external_metadata: ExternalMetadata;
  encryption: keyof typeof TSEncryptionMethod;
  version: ShinkaiVersion;

  constructor(body: MessageBody, external_metadata: ExternalMetadata, encryption: keyof typeof TSEncryptionMethod, version: ShinkaiVersion) {
    this.body = body;
    this.external_metadata = external_metadata;
    this.encryption = encryption;
    this.version = version;
  }

  async encrypt_outer_layer(self_sk: Uint8Array, destination_pk: Uint8Array): Promise<ShinkaiMessage> {
    if (this.body instanceof EncryptedMessageBody) {
      throw new Error('Message body is already encrypted');
    }

    if (this.encryption === TSEncryptionMethod.None) {
      throw new Error('Message encryption method is None');
    }

    const message_clone = new ShinkaiMessage(this.body, this.external_metadata, this.encryption, this.version);
    message_clone.body = await this.body.encrypt(self_sk, destination_pk);
    message_clone.encryption = TSEncryptionMethod.DiffieHellmanChaChaPoly1305;
    return message_clone;
  }

  async verify_outer_layer_signature(self_pk: Uint8Array): Promise<boolean> {
    return verify_outer_layer_signature(self_pk, this);
  };

  async sign_outer_layer(self_sk: Uint8Array): Promise<ShinkaiMessage> {
    const message_clone = new ShinkaiMessage(this.body, this.external_metadata, this.encryption, this.version);
    message_clone.external_metadata.signature = (await sign_outer_layer(self_sk, this)).signature;
    return message_clone;
  }
}
