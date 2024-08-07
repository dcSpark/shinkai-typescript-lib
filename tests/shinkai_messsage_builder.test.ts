import {
  generateEncryptionKeys,
} from "../src/cryptography/shinkai_encryption";
import { generateSignatureKeys } from "../src/cryptography/shinkai_signing";
import {
  JobScope,
  MessageSchemaType,
  SerializedAgent,
  TSEncryptionMethod,
} from "../src/schemas/schema_types";
import {
  EncryptedMessageBody,
  UnencryptedMessageBody,
} from "../src/shinkai_message/shinkai_message_body";
import {
  EncryptedMessageData,
  UnencryptedMessageData,
} from "../src/shinkai_message/shinkai_message_data";
import { ShinkaiMessageBuilder } from "../src/shinkai_message_builder/shinkai_message_builder";

describe("ShinkaiMessageBuilder pre-made methods", () => {
  it("should create a get all inboxes for profile request", async () => {
    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(
        "88b49468ed3ee4ea079f75eef9f651f09d3f18fd3a575c3c48d0052347462179",
        "hex"
      )
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(
        "91adf9c548e3ea0ba3f3fa38ecd239c3bec0dc5a63dcb430746ec4c43160d97e",
        "hex"
      )
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(
        "60045bdb15c24b161625cf05558078208698272bfe113f792ea740dbd79f4708",
        "hex"
      )
    );
    const sender = "@@localhost.shinkai";
    const recipient = "@@localhost.shinkai";
    const sender_subidentity = "main";

    const getAllInboxesMessage =
      await ShinkaiMessageBuilder.getAllInboxesForProfile(
        my_encryption_secret_key,
        my_signature_secret_key,
        receiver_public_key,
        sender + "/" + sender_subidentity,
        sender,
        sender_subidentity,
        recipient
      );

    const scheduled_time =
      getAllInboxesMessage.external_metadata.scheduled_time;

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content(sender + "/" + sender_subidentity)
      .set_body_encryption(TSEncryptionMethod.DiffieHellmanChaChaPoly1305)
      .set_message_schema_type(MessageSchemaType.TextContent)
      .set_internal_metadata_with_inbox(
        sender_subidentity,
        "",
        "",
        TSEncryptionMethod.None
      )
      .set_external_metadata_with_intra_sender(
        recipient,
        sender,
        sender_subidentity
      )
      .update_scheduled_time(scheduled_time)
      .build();

    const messageCopy = JSON.parse(JSON.stringify(message));
    const getAllInboxesMessageCopy = JSON.parse(
      JSON.stringify(getAllInboxesMessage)
    );

    // Ignore the 'content' and 'signature' fields in the comparison
    delete messageCopy.body.encrypted.content;
    delete messageCopy.external_metadata.signature;
    delete getAllInboxesMessageCopy.body.encrypted.content;
    delete getAllInboxesMessageCopy.external_metadata.signature;

    expect(messageCopy).toEqual(getAllInboxesMessageCopy);
  });

  it("should create a job message that matches a custom creation", async () => {
    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(
        "b01a8082dba0a866fa82d8d3e2dea25b053387e2ac06f35a5e237104de2c5374",
        "hex"
      )
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(
        "03b1cd8cdce9a8a54ce73a262f11c3ff17eedf9f696f14e9ab55a89476b22306",
        "hex"
      )
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(
        "798cbd64d78c4a0fba338b2a6349634940dc4e5b601db1029e02c41e0fe05679",
        "hex"
      )
    );
    const sender = "@@localhost.shinkai";
    const recipient = "@@localhost.shinkai";
    const sender_subidentity = "main";
    const job_id = "jobid_399c5571-3504-4aa7-a291-b1e086c1440c";
    const inbox = `job_inbox::${job_id}::false`;
    const text = "hello hello, are u there?";
    const message_raw_content = JSON.stringify({
      job_id: job_id,
      content: text,
      files_inbox: "",
      parent: "",
      workflow_code: null,
      workflow_name: null,
    });

    const jobMessage = await ShinkaiMessageBuilder.jobMessage(
      job_id,
      text,
      "",
      "",
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      sender,
      sender_subidentity,
      recipient,
      ""
    );

    const scheduled_time = jobMessage.external_metadata.scheduled_time;

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content(message_raw_content)
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.JobMessageSchema)
      .set_internal_metadata_with_inbox(
        sender_subidentity,
        "",
        inbox,
        TSEncryptionMethod.None
      )
      .set_external_metadata_with_intra_sender(
        recipient,
        sender,
        sender_subidentity
      )
      .update_scheduled_time(scheduled_time)
      .build();

    const messageCopy = JSON.parse(JSON.stringify(message));
    const jobMessageCopy = JSON.parse(JSON.stringify(jobMessage));

    expect(messageCopy).toEqual(jobMessageCopy);
  });

  it("should create a job message that matches the Rust implementation", async () => {
    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(
        "b01a8082dba0a866fa82d8d3e2dea25b053387e2ac06f35a5e237104de2c5374",
        "hex"
      )
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(
        "03b1cd8cdce9a8a54ce73a262f11c3ff17eedf9f696f14e9ab55a89476b22306",
        "hex"
      )
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(
        "798cbd64d78c4a0fba338b2a6349634940dc4e5b601db1029e02c41e0fe05679",
        "hex"
      )
    );
    const sender = "@@localhost.shinkai";
    const recipient = "@@localhost.shinkai";
    const sender_subidentity = "main";
    const scheduled_time = "2024-01-26T20:11:43.233Z";
    const job_id = "jobid_399c5571-3504-4aa7-a291-b1e086c1440c";
    const inbox = `job_inbox::${job_id}::false`;
    const message_raw_content = JSON.stringify({
      job_id: job_id,
      content: "hello hello, are u there?",
      files_inbox: "",
      parent: "",
    });

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content(message_raw_content)
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.JobMessageSchema)
      .set_internal_metadata_with_inbox(
        sender_subidentity,
        "",
        inbox,
        TSEncryptionMethod.None
      )
      .set_external_metadata_with_intra_sender(
        recipient,
        sender,
        sender_subidentity
      )
      .update_scheduled_time(scheduled_time)
      .build();

    const messageCopy = JSON.parse(JSON.stringify(message));

    const expectedOutput = {
      body: {
        unencrypted: {
          message_data: {
            unencrypted: {
              message_raw_content: message_raw_content,
              message_content_schema: "JobMessageSchema",
            },
          },
          internal_metadata: {
            sender_subidentity: sender_subidentity,
            recipient_subidentity: "",
            inbox: inbox,
            signature:
              "4b263279ec6b6026d15854e2610bf320bed40a8977944e245e3942e63be952704b3d95485396045f4419bfbda352b77a59a6fb14b87ba7b246b0d0dc7796ce03",
            encryption: "None",
          },
        },
      },
      external_metadata: {
        sender: sender,
        recipient,
        scheduled_time: scheduled_time,
        signature:
          "6f65662a56174be952a245c5f6fdebb74b6615aabfed1a0672fd6b08b7cffbc19b57ca216f9d24dc857c5ecc0b9ad577d154c694331bba15cc4b6ec26a699b0a",
        intra_sender: "main",
        other: "",
      },
      encryption: "None",
      version: "V1_0",
    };

    expect(messageCopy).toEqual(expectedOutput);
  });

  it("should create a get messages from inbox request", async () => {
    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(
        "b01a8082dba0a866fa82d8d3e2dea25b053387e2ac06f35a5e237104de2c5374",
        "hex"
      )
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(
        "03b1cd8cdce9a8a54ce73a262f11c3ff17eedf9f696f14e9ab55a89476b22306",
        "hex"
      )
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(
        "798cbd64d78c4a0fba338b2a6349634940dc4e5b601db1029e02c41e0fe05679",
        "hex"
      )
    );
    const sender = "main";
    const recipient = "@@localhost.shinkai";
    const sender_subidentity = "main";
    const scheduled_time = "2024-01-20T06:03:39.198Z";
    const inbox =
      "job_inbox::jobid_399c5571-3504-4aa7-a291-b1e086c1440c::false";

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content(
        JSON.stringify({ inbox: inbox, count: 10, offset: null })
      )
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.APIGetMessagesFromInboxRequest)
      .set_internal_metadata_with_inbox(
        sender_subidentity,
        "",
        inbox,
        TSEncryptionMethod.None
      )
      .set_external_metadata_with_intra_sender(
        recipient,
        sender,
        sender_subidentity
      )
      .update_scheduled_time(scheduled_time)
      .build();

    const messageCopy = JSON.parse(JSON.stringify(message));
    console.log("### message: ");
    console.log(messageCopy);

    console.log("### message string: ");
    console.log(JSON.stringify(message));
    // Add your assertions here
  });

  it("should create a registration message", async () => {
    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(
        "d890da39e7309ef5ee55a8a694c1889e59062b15b3b7ab2dde46b00e7c19706a",
        "hex"
      )
    );
    const my_signature_secret_key = new Uint8Array(
      Buffer.from(
        "5441da0faafb6c1b0352bd6c41b2e90d4190603b787780d8f2d5d6566fe86e21",
        "hex"
      )
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(
        "c91c2e5003be179f1e4611cd2557ebc197673e894a0b6964fba52c997d4e612b",
        "hex"
      )
    );
    const sender = "main";
    const recipient = "@@localhost.shinkai";
    const sender_subidentity = "main_device";
    const scheduled_time = "2024-01-18T22:05:17.185Z";
    const other = Buffer.from(receiver_public_key).toString("hex");
    const message_raw_content =
      '{"code":"","registration_name":"main_device","device_identity_pk":"f08641cc020000aa3d260e9a692f46c4e1589c520a03c5c022668e692e32efeb","device_encryption_pk":"c91c2e5003be179f1e4611cd2557ebc197673e894a0b6964fba52c997d4e612b","profile_identity_pk":"55d89ebd57b7aae47ce235b5761d7b1ba48c3e8823f8d7903f586d4ef36cc3c4","profile_encryption_pk":"4202cb5e8ed6cf909236d3f4a08dd205f5fdf925bfac4dc09f5781fec8965b09","identity_type":"device","permission_type":"admin"}';

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content(message_raw_content)
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.TextContent)
      .set_internal_metadata(sender_subidentity, "", TSEncryptionMethod.None)
      .set_external_metadata_with_schedule_and_other(
        recipient,
        sender,
        scheduled_time,
        other
      )
      .build();

    const messageCopy = JSON.parse(JSON.stringify(message));

    // console.log("### message: ");
    // console.log(util.inspect(messageCopy, false, null, true));

    const expectedOutput = {
      body: {
        unencrypted: {
          message_data: {
            unencrypted: {
              message_raw_content: message_raw_content,
              message_content_schema: "TextContent",
            },
          },
          internal_metadata: {
            sender_subidentity: sender_subidentity,
            recipient_subidentity: "",
            inbox:
              "inbox::@@localhost.shinkai::@@main.shinkai/main_device::false",
            signature:
              "fb4d0385f4207ba1881663e75c60e97a70378a141d061707d3168a5aa8481f3ca20e5b0b54fbb68d6603ea15a6aa8197027a7d52f5c33c112bf692fd4b7be603",
            encryption: "None",
          },
        },
      },
      external_metadata: {
        sender: sender,
        recipient,
        scheduled_time: scheduled_time,
        signature:
          "b167108937196fefc8cc0e3c7cdd526778847d3d601094850c4266bd6384146f96f9984ba1f1fc775dd187fe9b1ede1c8af43f421e88a6bcdf0937f437c4ed09",
        intra_sender: "",
        other:
          "c91c2e5003be179f1e4611cd2557ebc197673e894a0b6964fba52c997d4e612b",
      },
      encryption: "None",
      version: "V1_0",
    };

    expect(messageCopy).toEqual(expectedOutput);
  });

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
      const messageData = message.body.unencrypted
        .message_data as UnencryptedMessageData;
      if ("message_raw_content" in messageData.unencrypted) {
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
      const messageData = message.body.unencrypted
        .message_data as UnencryptedMessageData;
      if ("message_raw_content" in messageData.unencrypted) {
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
      local_vrkai: ["bucket1", "bucket2"],
      local_vrpack: [],
      vector_fs_items: [],
      vector_fs_folders: [],
      network_folders: [],
    };

    const message = await ShinkaiMessageBuilder.jobCreation(
      scope,
      false,
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

    const message =
      await ShinkaiMessageBuilder.createCustomShinkaiMessageToNode(
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

  it("should create a custom Shinkai message for device registration", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_device_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_device_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
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

    const message = await ShinkaiMessageBuilder.useCodeRegistrationForDevice(
      my_device_encryption_sk,
      my_device_signature_sk,
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

  it("should create an initial registration message with no code for device", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_device_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_device_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const profile_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const profile_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const registration_name = "registration_name";

    const message =
      await ShinkaiMessageBuilder.initialRegistrationWithNoCodeForDevice(
        my_device_encryption_sk,
        my_device_signature_sk,
        profile_encryption_sk,
        profile_signature_sk,
        registration_name,
        sender_subidentity,
        sender,
        receiver
      );

    // Check if the message body is an instance of UnencryptedMessageBody
    if (message.body instanceof UnencryptedMessageBody) {
      // You can add your assertions here related to the unencrypted message
      // For example, you might want to check if the content is not empty
      expect(message.body.unencrypted).not.toBeUndefined();
    } else {
      throw new Error("Message body is not unencrypted");
    }

    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });

  it("should create a files inbox with symmetric key", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_subidentity_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_subidentity_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const symmetric_key_sk = "symmetric_key";

    const message = await ShinkaiMessageBuilder.createFilesInboxWithSymKey(
      my_subidentity_encryption_sk,
      my_subidentity_signature_sk,
      receiver_public_key,
      symmetric_key_sk,
      sender,
      sender_subidentity,
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

  it("should get all inboxes for profile", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_subidentity_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_subidentity_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const full_profile = "full_profile";

    const message = await ShinkaiMessageBuilder.getAllInboxesForProfile(
      my_subidentity_encryption_sk,
      my_subidentity_signature_sk,
      receiver_public_key,
      full_profile,
      sender,
      sender_subidentity,
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

  it("should get last messages from inbox", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_subidentity_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_subidentity_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const inbox = "inbox_name";
    const count = 10;
    const offset = null;

    const message = await ShinkaiMessageBuilder.getLastMessagesFromInbox(
      my_subidentity_encryption_sk,
      my_subidentity_signature_sk,
      receiver_public_key,
      inbox,
      count,
      offset,
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

  it("should get last unread messages from inbox", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_subidentity_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_subidentity_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const inbox = "inbox_name";
    const count = 10;
    const offset = null;

    const message = await ShinkaiMessageBuilder.getLastUnreadMessagesFromInbox(
      my_subidentity_encryption_sk,
      my_subidentity_signature_sk,
      receiver_public_key,
      inbox,
      count,
      offset,
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

  it("should request to add an agent", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_subidentity_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_subidentity_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const agent: SerializedAgent = {
      id: "agent1",
      full_identity_name: "ShinkaiName",
      perform_locally: false,
      external_url: "http://example.com",
      api_key: "123456",
      model: {
        OpenAI: {
          model_type: "gpt-3",
        },
      },
      toolkit_permissions: ["permission1", "permission2"],
      storage_bucket_permissions: ["bucket1", "bucket2"],
      allowed_message_senders: ["sender1", "sender2"],
    };

    const message = await ShinkaiMessageBuilder.requestAddAgent(
      my_subidentity_encryption_sk,
      my_subidentity_signature_sk,
      receiver_public_key,
      agent,
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

  it("should read up to a certain time", async () => {
    const encryptionKeys = await generateEncryptionKeys();
    const signatureKeys = await generateSignatureKeys();

    const my_subidentity_encryption_sk = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_sk_string, "hex")
    );
    const my_subidentity_signature_sk = new Uint8Array(
      Buffer.from(signatureKeys.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(encryptionKeys.my_encryption_pk_string, "hex")
    );
    const sender = "@@sender.shinkai";
    const receiver = "@@receiver.shinkai";
    const sender_subidentity = "sender_subidentity";
    const inbox = "inbox_name";
    const upToTime = "2022-01-01T00:00:00Z";

    const message = await ShinkaiMessageBuilder.readUpToTime(
      my_subidentity_encryption_sk,
      my_subidentity_signature_sk,
      receiver_public_key,
      inbox,
      upToTime,
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

  it("should create an error message", async () => {
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
    const error_msg = "An error occurred";

    const message = await ShinkaiMessageBuilder.errorMessage(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      sender,
      receiver,
      error_msg
    );

    // Check if the message body is an instance of EncryptedMessageBody
    if (message.body instanceof UnencryptedMessageBody) {
      const messageData = message.body.unencrypted.message_data;
      if (messageData instanceof EncryptedMessageData)
        expect(messageData.data).not.toBe("");
    } else {
      throw new Error("Message body is not encrypted");
    }

    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(receiver);
  });
});

describe("ShinkaiMessageBuilder general tests", () => {
  it("should build a message with all fields and no encryption", async () => {
    const my_identity_sk = await generateSignatureKeys();
    const my_encryption_sk = await generateEncryptionKeys();
    const node2_encryption_pk = await generateEncryptionKeys();

    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(my_encryption_sk.my_encryption_sk_string, "hex")
    );
    const my_identity_secret_key = new Uint8Array(
      Buffer.from(my_identity_sk.my_identity_sk_string, "hex")
    );
    const my_identity_public_key = new Uint8Array(
      Buffer.from(my_identity_sk.my_identity_pk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(node2_encryption_pk.my_encryption_pk_string, "hex")
    );

    const recipient = "@@other_node.shinkai";
    const sender = "@@my_node.shinkai";
    const scheduled_time = "2023-07-02T20:53:34Z";

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_identity_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content("body content")
      .set_body_encryption(TSEncryptionMethod.None)
      .set_message_schema_type(MessageSchemaType.TextContent)
      .set_internal_metadata("", "", TSEncryptionMethod.None)
      .set_external_metadata_with_schedule(recipient, sender, scheduled_time)
      .build();

    expect(message).toBeDefined();

    if (message.body instanceof UnencryptedMessageBody) {
      const messageData = message.body.unencrypted
        .message_data as UnencryptedMessageData;
      if ("message_raw_content" in messageData.unencrypted) {
        expect(messageData.unencrypted.message_raw_content).toBe(
          "body content"
        );
      } else {
        throw new Error("Message data is not unencrypted");
      }
      expect(
        message.body.unencrypted.internal_metadata.sender_subidentity
      ).toBe("");
      expect(
        message.body.unencrypted.internal_metadata.recipient_subidentity
      ).toBe("");
      expect(message.body.unencrypted.internal_metadata.inbox).toBe(
        "inbox::@@my_node.shinkai::@@other_node.shinkai::false"
      );
    }

    expect(message.encryption).toBe(TSEncryptionMethod.None);
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.scheduled_time).toBe(scheduled_time);
    expect(message.external_metadata.recipient).toBe(recipient);
    expect(
      message.verify_outer_layer_signature(my_identity_public_key)
    ).toBeTruthy();
  });

  it("should build a message with all fields and body encryption", async () => {
    const my_identity_sk = await generateSignatureKeys();
    const my_encryption_sk = await generateEncryptionKeys();
    const node2_encryption_pk = await generateEncryptionKeys();

    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(my_encryption_sk.my_encryption_sk_string, "hex")
    );
    const my_identity_secret_key = new Uint8Array(
      Buffer.from(my_identity_sk.my_identity_sk_string, "hex")
    );
    const my_identity_public_key = new Uint8Array(
      Buffer.from(my_identity_sk.my_identity_pk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(node2_encryption_pk.my_encryption_pk_string, "hex")
    );

    const recipient = "@@other_node.shinkai";
    const sender = "@@my_node.shinkai";

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_identity_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    const message = await messageBuilder
      .set_message_raw_content("body content")
      .set_body_encryption(TSEncryptionMethod.DiffieHellmanChaChaPoly1305)
      .set_message_schema_type(MessageSchemaType.TextContent)
      .set_internal_metadata("", "", TSEncryptionMethod.None)
      .set_external_metadata(recipient, sender)
      .build();

    expect(message).toBeDefined();

    if (message.body instanceof EncryptedMessageBody) {
      const decryptedMessage = await message.decrypt_outer_layer(
        my_encryption_secret_key,
        receiver_public_key
      );

      if (decryptedMessage.body instanceof UnencryptedMessageBody) {
        const messageData = decryptedMessage.body.unencrypted
          .message_data as UnencryptedMessageData;
        if ("message_raw_content" in messageData.unencrypted) {
          expect(messageData.unencrypted.message_raw_content).toBe(
            "body content"
          );
        } else {
          throw new Error("Message data is not unencrypted");
        }
        expect(
          decryptedMessage.body.unencrypted.internal_metadata.sender_subidentity
        ).toBe("");
        expect(
          decryptedMessage.body.unencrypted.internal_metadata
            .recipient_subidentity
        ).toBe("");
        expect(decryptedMessage.body.unencrypted.internal_metadata.inbox).toBe(
          "inbox::@@my_node.shinkai::@@other_node.shinkai::false"
        );
      }
    }

    expect(message.encryption).toBe(
      TSEncryptionMethod.DiffieHellmanChaChaPoly1305
    );
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(recipient);
    expect(
      message.verify_outer_layer_signature(my_identity_public_key)
    ).toBeTruthy();
  });

  it("should fail to build a message with missing fields", async () => {
    const my_identity_sk = await generateSignatureKeys();
    const my_encryption_sk = await generateEncryptionKeys();
    const node2_encryption_pk = await generateEncryptionKeys();

    const my_encryption_secret_key = new Uint8Array(
      Buffer.from(my_encryption_sk.my_encryption_sk_string, "hex")
    );
    const my_identity_secret_key = new Uint8Array(
      Buffer.from(my_identity_sk.my_identity_sk_string, "hex")
    );
    const receiver_public_key = new Uint8Array(
      Buffer.from(node2_encryption_pk.my_encryption_pk_string, "hex")
    );

    const messageBuilder = new ShinkaiMessageBuilder(
      my_encryption_secret_key,
      my_identity_secret_key,
      receiver_public_key
    );

    await messageBuilder.init();

    try {
      const message = await messageBuilder.build();
      fail("Message build should have thrown an error due to missing fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
