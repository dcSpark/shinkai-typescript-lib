# Examples

## How To Communicate With a Shinkai Node

If the node is in a pristine state, we need to register a new profile (with a device) before we can create a job or send a message. This involves generating two pairs of encryption and signature keys and using them to construct a registration message.

Usually the most basic flow is: create job, send message to job, get messages from inbox.

## How To Create a Shinkai Message (Examples)

For detailed examples demonstrating how to use the Shinkai Typescript Lib for various tasks, check out our [docs](docs/README.md). These examples cover a range of use cases from basic to advanced, helping you get started with the library quickly.

Each example is fully documented to explain the concepts and features being used, making it easy to understand how to integrate Shinkai Typescript Lib into your own projects.

### Registering a Profile (Optional if the Node is Pristine)

### Checking if the Node is Pristine

```typescript
async function isNodePristine(nodeAddress: string): Promise<boolean> {
  try {
    const url = new URL("/v1/shinkai_health", nodeAddress);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.is_pristine;
  } catch (error) {
    console.error("Error checking node health:", error);
    throw new Error("Failed to check if the node is pristine.");
  }
}
```

### Registering a Device

If the node is pristine, you can proceed to register a new profile (with a device). This involves generating two pairs of encryption and signature keys and using them to construct a registration message.

```typescript
import { generateEncryptionKeys, generateSignatureKeys } from "./shinkai_encryption";
import { ShinkaiMessageBuilder } from "@shinkai_protocol/shinkai-typescript-lib";

async function registerProfile(nodeAddress: string, registrationName: string, senderSubidentity: string, receiverProfileName: string) {
  // First, check if the node is pristine
  const pristine = await isNodePristine(nodeAddress);
  if (!pristine) {
    console.log("Node is not pristine. Registration may not be allowed.");
    return;
  }

  // Generate encryption and signature keys
  // We are going to use the same keys for both the device and the profile
  const encryptionKeys = await generateEncryptionKeys();
  const signatureKeys = await generateSignatureKeys();

  // Convert hex strings to Uint8Array
  const myDeviceEncryptionSk = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_sk_string, "hex"));
  const myDeviceSignatureSk = new Uint8Array(Buffer.from(signatureKeys.my_identity_sk_string, "hex"));
  // For registration, the profile's encryption and signature keys can be the same as the device's
  const profileEncryptionSk = myDeviceEncryptionSk;
  const profileSignatureSk = myDeviceSignatureSk;

  // Define sender and receiver identifiers explicitly
  const sender = "@@sender.shinkai"; // This should be replaced with the actual sender identifier
  const receiver = "@@receiver.shinkai"; // This should be replaced with the actual receiver identifier

  // Construct the registration message
  let message = await ShinkaiMessageBuilder.initialRegistrationWithNoCodeForDevice(
    myDeviceEncryptionSk,
    myDeviceSignatureSk,
    profileEncryptionSk,
    profileSignatureSk,
    registrationName, // Device registration name, e.g., 'main_device'
    senderSubidentity,
    sender, // Sender identifier
    receiver // Receiver identifier
  );

  // Assuming `postData` is a function to send the message to a Shinkai node and fetch the response
  let resp = await postData(message, "/v1/use_registration_code");

  // Check response status and return data or throw an error
  if (resp.status === "success") {
    console.log("Registration successful:", resp.data);
    return resp.data;
  } else {
    console.error("Registration failed:", resp);
    throw new Error(`Registration failed: ${JSON.stringify(resp)}`);
  }
}
```

### Creating a Job

First, we'll create a job by generating the necessary keys and using the ShinkaiMessageBuilder to construct a job creation message.

```typescript
async function createJob(agent: string) {
  // Generate encryption and signature keys
  const encryptionKeys = await generateEncryptionKeys();
  const signatureKeys = await generateSignatureKeys();

  // Convert hex strings to Uint8Array
  const encryptionSk = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_sk_string, "hex"));
  const signatureSk = new Uint8Array(Buffer.from(signatureKeys.my_identity_sk_string, "hex"));
  const receiverPublicKey = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_pk_string, "hex"));

  // Define sender and receiver identifiers
  const sender = "@@sender.shinkai";
  const receiver = "@@receiver.shinkai";

  // Construct the job creation message
  const jobCreationMessage = await ShinkaiMessageBuilder.jobCreation(
    { local: [], vector_fs: [] }, // Job scope
    encryptionSk,
    signatureSk,
    receiverPublicKey,
    sender,
    "profileName",
    receiver,
    agent
  );

  // Assuming `postData` is a function to send the message to a Shinkai node and fetch the response
  const response = await postData(jobCreationMessage, "/v1/create_job");
  console.log("Job creation response:", response);
  return response.data; // Assuming the job ID is in the response data
}
```

### Sending a Message to the Created Job

After creating a job, we'll send a message to it using the generated keys and the ShinkaiMessageBuilder for constructing a job message.

```typescript
async function sendMessageToJob(jobId: string, messageContent: string) {
  // Reuse the encryption and signature keys from job creation or generate new ones if needed
  const encryptionKeys = await generateEncryptionKeys();
  const signatureKeys = await generateSignatureKeys();

  const encryptionSk = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_sk_string, "hex"));
  const signatureSk = new Uint8Array(Buffer.from(signatureKeys.my_identity_sk_string, "hex"));
  const receiverPublicKey = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_pk_string, "hex"));

  // Construct the message to send to the job
  const message = await ShinkaiMessageBuilder.jobMessage(
    jobId,
    messageContent,
    "", // Optional files inbox
    "", // Optional parent message
    encryptionSk,
    signatureSk,
    receiverPublicKey,
    "@@sender.shinkai",
    "sender_subidentity",
    "@@receiver.shinkai",
    "receiver_subidentity"
  );

  // Send the message to the Shinkai node
  const response = await postData(message, "/v1/job_message");
  console.log("Message sending response:", response);
}
```

### Create a Shinkai Message to Fetch the Last Messages from an Inbox

```typescript
import { generateEncryptionKeys } from "./shinkai_encryption";
import { generateSignatureKeys } from "./shinkai_signature";
import { ShinkaiMessageBuilder } from "@shinkai_protocol/shinkai-typescript-lib";

async function getMessagesFromInbox(inbox: string) {
  // Generate encryption and signature keys
  const encryptionKeys = await generateEncryptionKeys();
  const signatureKeys = await generateSignatureKeys();

  // Convert hex strings to Uint8Array
  const mySubidentityEncryptionSk = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_sk_string, "hex"));
  const mySubidentitySignatureSk = new Uint8Array(Buffer.from(signatureKeys.my_identity_sk_string, "hex"));
  const receiverPublicKey = new Uint8Array(Buffer.from(encryptionKeys.my_encryption_pk_string, "hex"));

  // Define sender and receiver identifiers
  const sender = "@@sender.shinkai";
  const receiver = "@@receiver.shinkai";
  const senderSubidentity = "sender_subidentity";
  const count = 10;
  const offset = null; // Use null for offset if you want to start from the latest message

  // Construct the message to fetch the last messages from the specified inbox
  const message = await ShinkaiMessageBuilder.getLastMessagesFromInbox(
    mySubidentityEncryptionSk,
    mySubidentitySignatureSk,
    receiverPublicKey,
    inbox,
    count,
    offset,
    senderSubidentity,
    sender,
    receiver
  );

  // Assuming `postData` is a function to send the message to a Shinkai node and fetch the response
  const response = await postData(message, "/v1/last_messages_from_inbox");
  console.log("Inbox messages:", response);
}

// Example usage
const inboxName = "inbox_name";
getMessagesFromInbox(inboxName);
```

## License

The Shinkai Typescript Lib is open-source software licensed under the [MIT License](LICENSE). This means you can use, modify, and distribute it freely, provided you include the original copyright and license notice in any copies or substantial portions of the software.

For more details, see the [LICENSE](LICENSE) file in the project repository.