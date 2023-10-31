import { ShinkaiBody } from "./shinkai_body";
import { EncryptedShinkaiBody } from "./encrypted_shinkai_body";
import { encryptMessageBody } from "../cryptography/shinkai_encryption";


export abstract class MessageBody {
  abstract encrypt(self_sk: Uint8Array, destination_pk: Uint8Array): Promise<MessageBody>;
}

export class EncryptedMessageBody extends MessageBody {
  encrypted: EncryptedShinkaiBody;

  constructor(encrypted: EncryptedShinkaiBody) {
    super();
    this.encrypted = encrypted;
  }

  async encrypt(self_sk: Uint8Array, destination_pk: Uint8Array): Promise<MessageBody> {
    throw new Error('Message body is already encrypted');
  }
}

export class UnencryptedMessageBody extends MessageBody {
  unencrypted: ShinkaiBody;

  constructor(unencrypted: ShinkaiBody) {
    super();
    this.unencrypted = unencrypted;
  }

  async encrypt(self_sk: Uint8Array, destination_pk: Uint8Array): Promise<MessageBody> {
    let encryptedBody = await encryptMessageBody(
      JSON.stringify(this),
      self_sk,
      destination_pk,
    );
    
    return new EncryptedMessageBody(
      { content: encryptedBody }
    );
  }
}