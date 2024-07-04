import { ed25519 } from "@noble/curves/ed25519";
import { blake3 } from "@noble/hashes/blake3";
import { ShinkaiMessage } from "../shinkai_message/shinkai_message";
import { UnencryptedMessageBody } from "../shinkai_message/shinkai_message_body";
import { ShinkaiBody } from "../shinkai_message/shinkai_body";
import { HexString, toHexString } from "./crypto_utils";

// TODO(Nico): move somewhere else
export class ShinkaiMessageError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ShinkaiMessageError";
  }
}

export const generateSignatureKeys = async (
  seed?: Uint8Array
): Promise<{
  my_identity_sk_string: HexString;
  my_identity_pk_string: HexString;
}> => {
  seed = seed || ed25519.utils.randomPrivateKey();
  const privKey = new Uint8Array(seed);
  const pubKey = await ed25519.getPublicKey(privKey);

  const my_identity_sk_string: string = toHexString(privKey);
  const my_identity_pk_string: string = toHexString(pubKey);

  return {
    my_identity_sk_string,
    my_identity_pk_string,
  };
};

export async function verify_outer_layer_signature(
  publicKey: Uint8Array,
  shinkaiMessage: ShinkaiMessage
): Promise<boolean> {
  try {
    const hexSignature = shinkaiMessage.external_metadata.signature;
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

    const sortedShinkaiMessage = sortObjectKeys(messageCopy);
    // Calculate the hash of the modified message
    const messageHash = blake3FromObj(sortedShinkaiMessage);
    const messageHashMatched = messageHash.match(/.{1,2}/g);
    if (!messageHashMatched) {
      throw new ShinkaiMessageError(`Invalid message hash format`);
    }
    const messageHashBytes = new Uint8Array(
      messageHashMatched.map((byte) => parseInt(byte, 16))
    );

    return await ed25519.verify(signatureBytes, messageHashBytes, publicKey);
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
): Promise<void> {
  try {
    // Ensure that external_metadata.signature is empty
    let messageCopy = JSON.parse(JSON.stringify(shinkaiMessage));
    messageCopy.external_metadata.signature = "";

    const sortedShinkaiMessage = sortObjectKeys(messageCopy);
    const messageHash = blake3FromObj(sortedShinkaiMessage);
    const messageHashMatched = messageHash.match(/.{1,2}/g);
    if (!messageHashMatched) {
      throw new ShinkaiMessageError(`Invalid message hash format`);
    }
    const messageHashBytes = new Uint8Array(
      messageHashMatched.map((byte) => parseInt(byte, 16))
    );

    const signature = await ed25519.sign(messageHashBytes, secretKey);
    shinkaiMessage.external_metadata.signature = Array.from(signature)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    if (e instanceof Error) {
      throw new ShinkaiMessageError(`Signing error: ${e.message}`);
    } else {
      throw new ShinkaiMessageError(`Signing error: ${e}`);
    }
  }
}

export async function sign_inner_layer(
  secretKey: Uint8Array,
  shinkaiBody: ShinkaiBody
): Promise<void> {
  try {
    // Ensure that body.unencrypted.internal_metadata.signature is empty
    let messageCopy: ShinkaiBody = JSON.parse(JSON.stringify(shinkaiBody));
    messageCopy.internal_metadata.signature = "";

    const sortedShinkaiMessage = sortObjectKeys(messageCopy);
    const messageHash = blake3FromObj(sortedShinkaiMessage);
    const messageHashMatched = messageHash.match(/.{1,2}/g);
    if (!messageHashMatched) {
      throw new ShinkaiMessageError(`Invalid message hash format`);
    }
    const messageHashBytes = new Uint8Array(
      messageHashMatched.map((byte) => parseInt(byte, 16))
    );

    const signature = await ed25519.sign(messageHashBytes, secretKey);
    shinkaiBody.internal_metadata.signature = Array.from(signature)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    if (e instanceof Error) {
      console.log(shinkaiBody);
      throw new ShinkaiMessageError(`Signing error: ${e.message}`);
    } else {
      throw new ShinkaiMessageError(`Signing error: ${e}`);
    }
  }
}

export async function verify_inner_layer_signature(
  publicKey: Uint8Array,
  shinkaiBody: ShinkaiBody
): Promise<boolean> {
  try {
    const hexSignature = shinkaiBody.internal_metadata.signature;
    console.log("Signature from body:", hexSignature);
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
    let bodyCopy = JSON.parse(JSON.stringify(shinkaiBody));
    bodyCopy.internal_metadata.signature = "";

    const sortedShinkaiBody = sortObjectKeys(bodyCopy);
    // Calculate the hash of the modified message
    const bodyHash = blake3FromObj(sortedShinkaiBody);
    const bodyHashMatched = bodyHash.match(/.{1,2}/g);
    if (!bodyHashMatched) {
      throw new ShinkaiMessageError(`Invalid message hash format`);
    }
    const messageHashBytes = new Uint8Array(
      bodyHashMatched.map((byte) => parseInt(byte, 16))
    );

    return await ed25519.verify(signatureBytes, messageHashBytes, publicKey);
  } catch (e) {
    if (e instanceof Error) {
      throw new ShinkaiMessageError(`Signing error: ${e.message}`);
    } else {
      throw new ShinkaiMessageError(`Signing error: ${e}`);
    }
  }
}

export function blake3FromObj(obj: any): string {
  let sortedString = typeof obj === 'string' ? obj : JSON.stringify(obj);
  let hashAlt = blake3(sortedString);
  let hashAltHex = Array.from(new Uint8Array(hashAlt))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashAltHex;
}

function sortObjectKeys(obj: any): object {
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
      if (key in obj && typeof obj[key] === "object" && obj[key] !== null) {
        sortedObj[key] =
          obj[key] instanceof Object ? sortObjectKeys(obj[key]) : obj[key];
      } else {
        sortedObj[key] = obj[key];
      }
    });

  return sortedObj;
}
