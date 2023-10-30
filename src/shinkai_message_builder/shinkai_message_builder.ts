import { InboxName } from "../schemas/inbox_name";
import { MessageSchemaType, TSEncryptionMethod } from "../schemas/schema_types";
import { ShinkaiBody } from "../shinkai_message/shinkai_body";
import { ShinkaiData } from "../shinkai_message/shinkai_data";
import { ExternalMetadata } from "../shinkai_message/shinkai_external_metadata";
import { InternalMetadata } from "../shinkai_message/shinkai_internal_metadata";
import { ShinkaiMessage } from "../shinkai_message/shinkai_message";
import { MessageBody } from "../shinkai_message/shinkai_message_body";
import { MessageData } from "../shinkai_message/shinkai_message_data";
import { ShinkaiVersion } from "../shinkai_message/shinkai_version";

import * as nacl from 'tweetnacl';

type ProfileName = string;
type EncryptionStaticKey = Uint8Array;
type EncryptionPublicKey = Uint8Array;
type SignatureStaticKey = Uint8Array;
type SignaturePublicKey = Uint8Array;

class ShinkaiMessageBuilder {
  message_raw_content: string;
  message_content_schema: MessageSchemaType;
  internal_metadata?: InternalMetadata;
  external_metadata?: ExternalMetadata;
  encryption: TSEncryptionMethod;
  my_encryption_secret_key: EncryptionStaticKey;
  my_encryption_public_key: EncryptionPublicKey;
  my_signature_secret_key: SignatureStaticKey;
  my_signature_public_key: SignaturePublicKey;
  receiver_public_key: EncryptionPublicKey;
  version: ShinkaiVersion;
  optional_second_public_key_receiver_node?: EncryptionPublicKey;

  constructor(
    my_encryption_secret_key: Uint8Array,
    my_signature_secret_key: Uint8Array,
    receiver_public_key: Uint8Array
  ) {
    this.version = ShinkaiVersion.V1_0;
    this.my_encryption_public_key = nacl.box.keyPair.fromSecretKey(my_encryption_secret_key).publicKey;
    this.my_signature_public_key = nacl.sign.keyPair.fromSecretKey(my_signature_secret_key).publicKey;
    this.my_encryption_secret_key = my_encryption_secret_key;
    this.my_signature_secret_key = my_signature_secret_key;
    this.receiver_public_key = receiver_public_key;
    this.message_raw_content = "";
    this.message_content_schema = MessageSchemaType.Empty;
    this.encryption = TSEncryptionMethod.None;
  }

  set_body_encryption(encryption: TSEncryptionMethod): this {
    this.encryption = encryption;
    return this;
  }

  set_no_body_encryption(): this {
    this.encryption = TSEncryptionMethod.None;
    return this;
  }

  set_message_raw_content(message_raw_content: string): this {
    this.message_raw_content = message_raw_content;
    return this;
  }

  set_message_schema_type(content: MessageSchemaType): this {
    this.message_content_schema = content;
    return this;
  }

  set_internal_metadata(sender_subidentity: string, recipient_subidentity: string, encryption: TSEncryptionMethod): this {
    this.internal_metadata = {
      sender_subidentity,
      recipient_subidentity,
      inbox: "",
      signature: "",
      encryption,
    };
    return this;
  }

  external_metadata_with_other_and_intra_sender(
    recipient: ProfileName,
    sender: ProfileName,
    other: string,
    intra_sender: string
  ): this {
    let signature = "";
    let scheduled_time = new Date().toISOString();
    this.external_metadata = {
      sender,
      recipient,
      scheduled_time,
      signature,
      other,
      intra_sender,
    };
    return this;
  }
  
  external_metadata_with_intra_sender(
    recipient: ProfileName,
    sender: ProfileName,
    intra_sender: string
  ): this {
    let signature = "";
    let other = "";
    let scheduled_time = new Date().toISOString();
    this.external_metadata = {
      sender,
      recipient,
      scheduled_time,
      signature,
      other,
      intra_sender,
    };
    return this;
  }
  
  external_metadata_with_schedule(
    recipient: ProfileName,
    sender: ProfileName,
    scheduled_time: string
  ): this {
    let signature = "";
    let other = "";
    let intra_sender = "";
    this.external_metadata = {
      sender,
      recipient,
      scheduled_time,
      signature,
      other,
      intra_sender,
    };
    return this;
  }
  
  update_intra_sender(intra_sender: string): this {
    if (this.external_metadata) {
      this.external_metadata.intra_sender = intra_sender;
    }
    return this;
  }
  
  set_optional_second_public_key_receiver_node(
    optional_second_public_key_receiver_node: EncryptionPublicKey
  ): this {
    this.optional_second_public_key_receiver_node = optional_second_public_key_receiver_node;
    return this;
  }
  
  clone(): ShinkaiMessageBuilder {
    const clone = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
  
    // Deep clone of Uint8Array properties
    clone.my_encryption_secret_key = new Uint8Array(this.my_encryption_secret_key);
    clone.my_encryption_public_key = new Uint8Array(this.my_encryption_public_key);
    clone.my_signature_secret_key = new Uint8Array(this.my_signature_secret_key);
    clone.my_signature_public_key = new Uint8Array(this.my_signature_public_key);
    clone.receiver_public_key = new Uint8Array(this.receiver_public_key);
    clone.optional_second_public_key_receiver_node = this.optional_second_public_key_receiver_node ? new Uint8Array(this.optional_second_public_key_receiver_node) : undefined;
  
    return clone;
  }

  async build(): Promise<ShinkaiMessage | string> {
    let newSelf = this.clone();
  
    // Validations
    if (!newSelf.internal_metadata) {
      return "Internal metadata is required";
    }
  
    if (newSelf.encryption !== TSEncryptionMethod.None
      && newSelf.internal_metadata
      && newSelf.internal_metadata.encryption !== TSEncryptionMethod.None
      && !newSelf.optional_second_public_key_receiver_node) {
      return "Encryption should not be set on both body and internal metadata simultaneously without optional_second_public_key_receiver_node.";
    }
  
    // Fix inbox name if it's empty
    if (newSelf.internal_metadata && newSelf.internal_metadata.inbox === "") {
      if (newSelf.external_metadata) {
        // Generate a new inbox name
        // Print the value of external_metadata.sender to the browser console
        let newInboxName = InboxName.getRegularInboxNameFromParams(
          newSelf.external_metadata.sender,
          newSelf.internal_metadata.sender_subidentity,
          newSelf.external_metadata.recipient,
          newSelf.internal_metadata.recipient_subidentity,
          newSelf.internal_metadata.encryption !== TSEncryptionMethod.None,
        );
  
        if (typeof newInboxName === "string") {
          return "Failed to generate inbox name";
        }
  
        // Update the inbox name in the internal metadata
        newSelf.internal_metadata.inbox = newInboxName.value;
      } else {
        return "Inbox is required";
      }
    }
  
    // encrypted body or data if necessary
    if (newSelf.internal_metadata) {
      let data: ShinkaiData = {
        message_raw_content: newSelf.message_raw_content,
        message_content_schema: newSelf.message_content_schema,
      };
  
      // if self.internal_metadata.encryption is not None
      let newMessageData: MessageData;
      if (newSelf.internal_metadata.encryption !== TSEncryptionMethod.None) {
        let encryptedContent = await encryptMessageData(
          data,
          newSelf.my_encryption_secret_key,
          newSelf.receiver_public_key,
        );
  
        if (typeof encryptedContent === "string") {
          return "Failed to encrypt data content";
        }
  
        newMessageData = encryptedContent;
      } else {
        // If encryption method is None, just return body
        newMessageData = data;
      }
  
      let unsignedMsg = new ShinkaiMessage(
        new MessageBody(new ShinkaiBody(newMessageData, newSelf.internal_metadata)),
        newSelf.encryption,
        newSelf.external_metadata,
        newSelf.version,
      );
  
      // Sign inner layer
      let signResult = unsignedMsg.signInnerLayer(newSelf.my_signature_secret_key);
      if (typeof signResult === "string") {
        return "Failed to sign body";
      }
  
      let signedBody: ShinkaiBody;
      switch (unsignedMsg.body.constructor) {
        case MessageBody:
          signedBody = new ShinkaiBody(newMessageData, unsignedMsg.body.internal_metadata);
          break;
        default:
          return "Expected unencrypted message body";
      }
  
      // if self.encryption is not None
      let newBody: MessageBody;
      if (newSelf.encryption !== TSEncryptionMethod.None) {
        let secondPublicKey = newSelf.optional_second_public_key_receiver_node || newSelf.receiver_public_key;
  
        let encryptedBody = await encryptMessageBody(
          signedBody,
          newSelf.my_encryption_secret_key,
          secondPublicKey,
        );
  
        if (typeof encryptedBody === "string") {
          return "Failed to encrypt body";
        }
  
        newBody = encryptedBody;
      } else {
        // If encryption method is None, just return body
        newBody = new MessageBody(signedBody);
      }
  
      let unsignedMsg = new ShinkaiMessage(
        newBody,
        newSelf.encryption,
        newSelf.external_metadata,
        newSelf.version,
      );
      let signedMsg = unsignedMsg.signOuterLayer(newSelf.my_signature_secret_key);
  
      if (typeof signedMsg === "string") {
        return "Failed to sign message";
      }
  
      return signedMsg;
    } else {
      return "Missing fields";
    }
  }
}