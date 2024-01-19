import { IShinkaiBody, ShinkaiBody } from "./shinkai_body";
import { EncryptedShinkaiBody } from "./encrypted_shinkai_body";
import { encryptMessageBody } from "../cryptography/shinkai_encryption";
import { ShinkaiData } from "./shinkai_data";
import { InternalMetadata } from "./shinkai_internal_metadata";

export abstract class MessageBody {
  abstract encrypt(
    self_sk: Uint8Array,
    destination_pk: Uint8Array
  ): Promise<EncryptedMessageBody>;
}

export class EncryptedMessageBody extends MessageBody {
  encrypted: EncryptedShinkaiBody;

  constructor(encrypted: EncryptedShinkaiBody) {
    super();
    this.encrypted = encrypted;
  }

  async encrypt(
    self_sk: Uint8Array,
    destination_pk: Uint8Array
  ): Promise<EncryptedMessageBody> {
    throw new Error("Message body is already encrypted");
  }
}

export class UnencryptedMessageBody extends MessageBody {
  unencrypted: IShinkaiBody;

  constructor(unencrypted: IShinkaiBody) {
    super();
    this.unencrypted = unencrypted;
  }

  async encrypt(
    self_sk: Uint8Array,
    destination_pk: Uint8Array
  ): Promise<EncryptedMessageBody> {
    let encryptedBody = await encryptMessageBody(
      JSON.stringify(this),
      self_sk,
      destination_pk
    );

    return new EncryptedMessageBody({ content: encryptedBody });
  }

  async verify_inner_layer_signature(self_pk: Uint8Array): Promise<boolean> {
    return this.unencrypted.verify_inner_layer_signature(self_pk);
  }
  async sign_inner_layer(self_sk: Uint8Array): Promise<ShinkaiBody> {
    return this.unencrypted.sign_inner_layer(self_sk);
  }
}
