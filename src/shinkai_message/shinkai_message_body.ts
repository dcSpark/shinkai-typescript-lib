import { MessageSchemaType, TSEncryptionMethod } from "../schemas/schema_types";
import nacl from 'tweetnacl';
import { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { ShinkaiBody } from "./shinkai_body";
import { EncryptedShinkaiBody } from "./encrypted_shinkai_body";


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
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const key = nacl.box.before(destination_pk, self_sk);
    const messageUint8 = decodeUTF8(JSON.stringify(this.unencrypted));
    const box = nacl.secretbox(messageUint8, nonce, key);

    return new EncryptedMessageBody({
      content: encodeBase64(box),
    });
  }
}