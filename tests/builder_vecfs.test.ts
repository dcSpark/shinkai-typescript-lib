import {
  generateEncryptionKeys,
} from "../src/cryptography/shinkai_encryption";
import {
  JobScope,
  MessageSchemaType,
  SerializedAgent,
  TSEncryptionMethod,
} from "../src/schemas/schema_types";
import { IShinkaiBody } from "../src/shinkai_message/shinkai_body";
import {
  EncryptedMessageBody,
  UnencryptedMessageBody,
} from "../src/shinkai_message/shinkai_message_body";
import {
  EncryptedMessageData,
  UnencryptedMessageData,
} from "../src/shinkai_message/shinkai_message_data";
import { ShinkaiMessageBuilder } from "../src/shinkai_message_builder/shinkai_message_builder";

describe("ShinkaiMessageBuilder filesystem operations", () => {
  // Common setup for all tests
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
  const receiver_subidentity = "main";

  it("should create a folder creation message correctly", async () => {
    const folder_name = "NewFolder";
    const path = "/root/path/to";
    const message = await ShinkaiMessageBuilder.createFolder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      folder_name,
      path,
      sender,
      sender_subidentity,
      recipient,
      receiver_subidentity
    );

    // TODO: Update tests
    // console.log("createFolderMessage: ");
    // console.log(message);

    // // Assuming the message is encrypted, decrypt it
    // if (message.body instanceof EncryptedMessageBody) {
    //   const decryptedMessage = await message.decrypt_outer_layer(
    //     my_encryption_secret_key,
    //     receiver_public_key
    //   );

    //   console.log("decryptedMessage: ");
    //   console.log(JSON.stringify(decryptedMessage, null, 2));

    //   // Parse the decrypted message content
    //   const decryptedContent = JSON.parse(
    //     (decryptedMessage.body as IShinkaiBody).message_data.unencrypted.message_raw_content
    //   );

    //   // Verify the folder_name and path in the decrypted message
    //   expect(decryptedContent.folder_name).toBe(folder_name);
    //   expect(decryptedContent.path).toBe(path);
    // }

    // Verify encryption method and metadata
    expect(message.encryption).toBe(
      TSEncryptionMethod.DiffieHellmanChaChaPoly1305
    );
    expect(message.external_metadata.sender).toBe(sender);
    expect(message.external_metadata.recipient).toBe(recipient);
  });

  it("should create a folder move message correctly", async () => {
    const origin_path = "/root/old";
    const destination_path = "/root/new";
    const moveFolderMessage = await ShinkaiMessageBuilder.moveFolder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      origin_path,
      destination_path,
      sender,
      sender_subidentity,
      recipient,
      receiver_subidentity
    );

    // Assertions for moveFolderMessage
    expect(moveFolderMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should create a folder copy message correctly", async () => {
    const origin_path = "/root/old";
    const destination_path = "/root/newCopy";
    const copyFolderMessage = await ShinkaiMessageBuilder.copyFolder(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      origin_path,
      destination_path,
      sender,
      sender_subidentity,
      recipient,
      receiver_subidentity
    );

    // Assertions for copyFolderMessage
    expect(copyFolderMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should create an item move message correctly", async () => {
    const origin_path = "/root/old/item.txt";
    const destination_path = "/root/new/item.txt";
    const moveItemMessage = await ShinkaiMessageBuilder.moveItem(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      origin_path,
      destination_path,
      sender,
      sender_subidentity,
      recipient,
      receiver_subidentity
    );

    // Assertions for moveItemMessage
    expect(moveItemMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should create an item copy message correctly", async () => {
    const origin_path = "/root/old/item.txt";
    const destination_path = "/root/newCopy/item.txt";
    const copyItemMessage = await ShinkaiMessageBuilder.copyItem(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      origin_path,
      destination_path,
      sender,
      sender_subidentity,
      recipient,
      receiver_subidentity
    );

    // Assertions for copyItemMessage
    expect(copyItemMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should create items correctly", async () => {
    const destination_path = "/root/new/items";
    const file_inbox = "inbox_for_files";
    const createItemsMessage = await ShinkaiMessageBuilder.createItems(
      my_encryption_secret_key,
      my_signature_secret_key,
      receiver_public_key,
      destination_path,
      file_inbox,
      sender,
      sender_subidentity,
      recipient,
      receiver_subidentity
    );

    // Assertions for createItemsMessage
    expect(createItemsMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should retrieve a resource correctly", async () => {
    const path = "/root/resource";
    const retrieveResourceMessage =
      await ShinkaiMessageBuilder.retrieveResource(
        my_encryption_secret_key,
        my_signature_secret_key,
        receiver_public_key,
        path,
        sender,
        sender_subidentity,
        recipient,
        receiver_subidentity
      );

    // Assertions for retrieveResourceMessage
    expect(retrieveResourceMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should retrieve path simplified correctly", async () => {
    const path = "/root/path/to/resource";
    const retrievePathSimplifiedMessage =
      await ShinkaiMessageBuilder.retrievePathSimplified(
        my_encryption_secret_key,
        my_signature_secret_key,
        receiver_public_key,
        path,
        sender,
        sender_subidentity,
        recipient,
        receiver_subidentity
      );

    // Assertions for retrievePathSimplifiedMessage
    expect(retrievePathSimplifiedMessage).toBeDefined();
    // Add more detailed assertions here
  });

  it("should retrieve vector search simplified correctly", async () => {
    const search = "query";
    const path = "/root/path/to";
    const max_results = 10;
    const max_files_to_scan = 100;
    const retrieveVectorSearchSimplifiedMessage =
      await ShinkaiMessageBuilder.retrieveVectorSearchSimplified(
        my_encryption_secret_key,
        my_signature_secret_key,
        receiver_public_key,
        search,
        path,
        max_results,
        max_files_to_scan,
        sender,
        sender_subidentity,
        recipient,
        receiver_subidentity
      );

    // Assertions for retrieveVectorSearchSimplifiedMessage
    expect(retrieveVectorSearchSimplifiedMessage).toBeDefined();
    // Add more detailed assertions here
  });
});
