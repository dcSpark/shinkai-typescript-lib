import { MessageSchemaType, ShinkaiMessage, ShinkaiMessageBuilder, TSEncryptionMethod } from "@shinkai_protocol/shinkai-typescript-lib";
import { postData } from "./utils";

export class ShinkaiManager {
  private encryptionSecretKey: Uint8Array;
  private signatureSecretKey: Uint8Array;
  private receiverPublicKey: Uint8Array;
  private shinkaiName: string;
  private profileName: string;
  private deviceName: string;

  constructor(encryptionSK: string, signatureSK: string, receiverPK: string, shinkaiName: string, profileName: string, deviceName: string) {
    this.encryptionSecretKey = new Uint8Array(Buffer.from(encryptionSK, "hex"));
    this.signatureSecretKey = new Uint8Array(Buffer.from(signatureSK, "hex"));
    this.receiverPublicKey = new Uint8Array(Buffer.from(receiverPK, "hex"));
    this.shinkaiName = shinkaiName;
    this.profileName = profileName;
    this.deviceName = deviceName;
  }

  async buildJobMessage(messageContent: string, inbox: string): Promise<any> {
    return await ShinkaiMessageBuilder.jobMessage(
      inbox,
      messageContent,
      "",
      "",
      this.encryptionSecretKey,
      this.signatureSecretKey,
      this.receiverPublicKey,
      this.shinkaiName,
      this.profileName,
      this.shinkaiName,
      ""
    )
  }

  async buildGetMessagesForInbox(inbox: string): Promise<any> {
    const messageBuilder = new ShinkaiMessageBuilder(
      this.encryptionSecretKey,
      this.signatureSecretKey,
      this.receiverPublicKey
    );

    await messageBuilder.init();
    const currentDate = new Date().toISOString();

    return messageBuilder
      .set_message_raw_content(JSON.stringify({ inbox: inbox, count: 10, offset: null }))
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.APIGetMessagesFromInboxRequest)
      .set_internal_metadata_with_inbox(this.profileName, "", inbox, TSEncryptionMethod.None)
      .set_external_metadata_with_intra_sender(
        this.shinkaiName, this.shinkaiName, this.profileName
      )
      .build();
  }

  async buildMessage(messageContent: string): Promise<any> {
    const messageBuilder = new ShinkaiMessageBuilder(
      this.encryptionSecretKey,
      this.signatureSecretKey,
      this.receiverPublicKey
    );

    await messageBuilder.init();

    const currentDate = new Date().toISOString();

    return messageBuilder
      .set_message_raw_content(messageContent)
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.TextContent)
      .set_internal_metadata(this.deviceName, "", TSEncryptionMethod.None)
      .set_external_metadata_with_schedule_and_other(
        this.shinkaiName, this.profileName, currentDate, Buffer.from(this.receiverPublicKey).toString("hex")
      )
      .build();
  }
}