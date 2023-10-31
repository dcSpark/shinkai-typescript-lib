import * as ed from "noble-ed25519";
import { blake3 } from "@noble/hashes/blake3";
import { ShinkaiMessage } from "../shinkai_message/shinkai_message";

// TODO(Nico): move somewhere
export class ShinkaiMessageError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ShinkaiMessageError";
  }
}

export async function verify_outer_layer_signature(
  publicKey: Uint8Array,
  shinkaiMessage: ShinkaiMessage
): Promise<boolean> {
  try {
    const hexSignature = shinkaiMessage.external_metadata.signature;
    console.log("Signature from message:", hexSignature);
    if (!hexSignature) {
      throw new ShinkaiMessageError(`Signature is missing`);
    }
    const matched = hexSignature.match(/.{1,2}/g);
    if (!matched) {
      throw new ShinkaiMessageError(`Invalid signature format`);
    }
    const signatureBytes = new Uint8Array(
      matched.map((byte) => parseInt(byte, 16))
    );

    // Create a copy of the message with an empty signature
    let messageCopy = JSON.parse(JSON.stringify(shinkaiMessage));
    messageCopy.external_metadata.signature = "";

    const sortedShinkaiMessage = sortObjectKeys(shinkaiMessage);
    // Calculate the hash of the modified message
    const messageHash = blake3FromObj(sortedShinkaiMessage);
    const messageHashMatched = messageHash.match(/.{1,2}/g);
    if (!messageHashMatched) {
      throw new ShinkaiMessageError(`Invalid message hash format`);
    }
    const messageHashBytes = new Uint8Array(
      messageHashMatched.map((byte) => parseInt(byte, 16))
    );

    return await ed.verify(signatureBytes, messageHashBytes, publicKey);
  } catch (e) {
    if (e instanceof Error) {
      throw new ShinkaiMessageError(`Signing error: ${e.message}`);
    } else {
      throw new ShinkaiMessageError(`Signing error: ${e}`);
    }
  }
}

export async function sign_outer_layer(
  secretKey: Uint8Array,
  shinkaiMessage: ShinkaiMessage
): Promise<{ signature: string }> {
  try {
    // Ensure that external_metadata.signature is empty
    let messageCopy = JSON.parse(JSON.stringify(shinkaiMessage));
    messageCopy.external_metadata.signature = "";

    const sortedShinkaiMessage = sortObjectKeys(shinkaiMessage);
    const messageHash = blake3FromObj(sortedShinkaiMessage);
    const messageHashMatched = messageHash.match(/.{1,2}/g);
    if (!messageHashMatched) {
      throw new ShinkaiMessageError(`Invalid message hash format`);
    }
    const messageHashBytes = new Uint8Array(
      messageHashMatched.map((byte) => parseInt(byte, 16))
    );

    const signature = await ed.sign(messageHashBytes, secretKey);
    shinkaiMessage.external_metadata.signature = Array.from(signature)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return shinkaiMessage.external_metadata;
  } catch (e) {
    if (e instanceof Error) {
      throw new ShinkaiMessageError(`Signing error: ${e.message}`);
    } else {
      throw new ShinkaiMessageError(`Signing error: ${e}`);
    }
  }
}

function blake3FromObj(obj: any): string {
  let sortedString = JSON.stringify(obj, Object.keys(obj).sort());
  let hashAlt = blake3(sortedString);
  let hashAltHex = Array.from(new Uint8Array(hashAlt))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashAltHex;
}

function sortObjectKeys(obj: ShinkaiMessage): object {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedObj: { [key: string]: any } = {};

  Object.keys(obj)
    .sort()
    .forEach((key: string) => {
      if (
        key in obj &&
        typeof obj[key as keyof ShinkaiMessage] === "object" &&
        obj[key as keyof ShinkaiMessage] !== null
      ) {
        sortedObj[key] =
          obj[key as keyof ShinkaiMessage] instanceof Object
            ? sortObjectKeys(obj[key as keyof ShinkaiMessage] as any)
            : obj[key as keyof ShinkaiMessage];
      } else {
        sortedObj[key] = obj[key as keyof ShinkaiMessage];
      }
    });

  return sortedObj;
}
