import nacl from "tweetnacl";
import { encryptMessageBody, encryptMessageData } from "../cryptography/shinkai_encryption";
import { sign_inner_layer, sign_outer_layer } from "../cryptography/shinkai_signing";
import { InboxName } from "../schemas/inbox_name";
import { MessageSchemaType, TSEncryptionMethod } from "../schemas/schema_types";
import { ShinkaiBody } from "../shinkai_message/shinkai_body";
import { ShinkaiData } from "../shinkai_message/shinkai_data";
import { ExternalMetadata } from "../shinkai_message/shinkai_external_metadata";
import { InternalMetadata } from "../shinkai_message/shinkai_internal_metadata";
import { ShinkaiMessage } from "../shinkai_message/shinkai_message";
import { EncryptedMessageBody, MessageBody, UnencryptedMessageBody } from "../shinkai_message/shinkai_message_body";
import { MessageData } from "../shinkai_message/shinkai_message_data";
import { ShinkaiVersion } from "../shinkai_message/shinkai_version";
import * as ed from "noble-ed25519";

export type ProfileName = string;
export type EncryptionStaticKey = Uint8Array;
export type EncryptionPublicKey = Uint8Array;
export type SignatureStaticKey = Uint8Array;
export type SignaturePublicKey = Uint8Array;

export class ShinkaiMessageBuilder {
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
    this.my_encryption_secret_key = my_encryption_secret_key;
    this.my_signature_secret_key = my_signature_secret_key;
    this.receiver_public_key = receiver_public_key;
    this.message_raw_content = "";
    this.message_content_schema = MessageSchemaType.Empty;
    this.encryption = TSEncryptionMethod.None;
    this.my_encryption_public_key = nacl.box.keyPair.fromSecretKey(this.my_encryption_secret_key).publicKey;
    this.my_signature_public_key = new Uint8Array();
  }

  async init(): Promise<this> {
    this.my_signature_public_key = await ed.getPublicKey(this.my_signature_secret_key);
    return this;
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

  async build(): Promise<ShinkaiMessage> {
    let newSelf = this.clone();
  
    // Validations
    if (!newSelf.internal_metadata) {
      throw new Error("Internal metadata is required");
    }

    if (!newSelf.external_metadata) {
      throw new Error("External metadata is required");
    }
  
    if (newSelf.encryption !== TSEncryptionMethod.None
      && newSelf.internal_metadata
      && newSelf.internal_metadata.encryption !== TSEncryptionMethod.None
      && !newSelf.optional_second_public_key_receiver_node) {
        throw new Error("Encryption should not be set on both body and internal metadata simultaneously without optional_second_public_key_receiver_node.");
    }
  
    // Fix inbox name if it's empty
    if (newSelf.internal_metadata && newSelf.internal_metadata.inbox === "") {
      if (newSelf.external_metadata) {
        // Generate a new inbox name
        let newInboxName = InboxName.getRegularInboxNameFromParams(
          newSelf.external_metadata.sender,
          newSelf.internal_metadata.sender_subidentity,
          newSelf.external_metadata.recipient,
          newSelf.internal_metadata.recipient_subidentity,
          newSelf.internal_metadata.encryption !== TSEncryptionMethod.None,
        );
  
        if (typeof newInboxName === "string") {
          throw new Error("Failed to generate inbox name");
        }
  
        // Update the inbox name in the internal metadata
        newSelf.internal_metadata.inbox = newInboxName.value;
      } else {
        throw new Error("Inbox is required");
      }
    }
  
    // encrypted body or data if necessary
    if (newSelf.internal_metadata) {
      let data: ShinkaiData = {
        message_raw_content: newSelf.message_raw_content,
        message_content_schema: newSelf.message_content_schema,
      };
  
      let newMessageData: MessageData;
      if (newSelf.internal_metadata.encryption !== TSEncryptionMethod.None) {
        let encryptedContent = await new UnencryptedMessageBody({
          message_data: { unencrypted: data },
          internal_metadata: newSelf.internal_metadata
        }).encrypt(newSelf.my_encryption_secret_key, newSelf.receiver_public_key);
  
        if (encryptedContent instanceof EncryptedMessageBody) {
          newMessageData = { encrypted: encryptedContent.encrypted };
        } else {
          throw new Error("Failed to encrypt data content");
        }
      } else {
        // If encryption method is None, just return body
        newMessageData = { unencrypted: data };
      }
  
      let unsignedMsg = new ShinkaiMessage(
        new UnencryptedMessageBody({
          message_data: newMessageData,
          internal_metadata: newSelf.internal_metadata
        }),
        newSelf.external_metadata,
        newSelf.encryption,
        newSelf.version,
      );
  
      // if self.encryption is not None
      let newBody: MessageBody;
      if (newSelf.encryption !== TSEncryptionMethod.None) {
        let secondPublicKey = newSelf.optional_second_public_key_receiver_node || newSelf.receiver_public_key;
  
        let encryptedBody = await unsignedMsg.body.encrypt(
          newSelf.my_encryption_secret_key,
          secondPublicKey,
        );
  
        if (encryptedBody instanceof EncryptedMessageBody) {
          newBody = encryptedBody;
        } else {
          throw new Error("Failed to encrypt body");
        }
      } else {
        // If encryption method is None, just return body
        newBody = unsignedMsg.body;
      }
  
      let signedMsg = new ShinkaiMessage(
        newBody,
        newSelf.external_metadata,
        newSelf.encryption,
        newSelf.version,
      );
  
      return signedMsg;
    } else {
      throw new Error("Missing fields");
    }
  }

  public static ackMessage(
    my_encryption_secret_key: EncryptionStaticKey,
    my_signature_secret_key: SignatureStaticKey,
    receiver_public_key: EncryptionPublicKey,
    sender: ProfileName,
    receiver: ProfileName,
  ): Promise<ShinkaiMessage> {
    return new ShinkaiMessageBuilder(my_encryption_secret_key, my_signature_secret_key, receiver_public_key)
      .set_message_raw_content("ACK")
      .set_internal_metadata("", "", TSEncryptionMethod.None)
      .set_no_body_encryption()
      .external_metadata_with_intra_sender(receiver, sender, "")
      .build();
  }
}