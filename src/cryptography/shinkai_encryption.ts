// import * as ed from "@noble/ed25519";
import * as ed from "noble-ed25519";
import { generateKeyPair, sharedKey } from "curve25519-js";
import { toHexString } from "./crypto_utils";
import { createHash, randomBytes } from "crypto";
import sodium from "libsodium-wrappers-sumo";
import { blake3 } from "@noble/hashes/blake3";
import nacl from "tweetnacl";
import crypto from "crypto";

export type HexString = string;
// Previous

export const generateEncryptionKeys = async (
  seed?: Uint8Array
): Promise<{
  my_encryption_sk_string: HexString;
  my_encryption_pk_string: HexString;
}> => {
  seed = seed || crypto.getRandomValues(new Uint8Array(32));
  const encryptionKeys = generateKeyPair(seed);
  const my_encryption_sk_string: string = toHexString(encryptionKeys.private);
  const my_encryption_pk_string: string = toHexString(encryptionKeys.public);

  return {
    my_encryption_sk_string,
    my_encryption_pk_string,
  };
};

export const generateSignatureKeys = async (
  seed?: Uint8Array
): Promise<{
  my_identity_sk_string: HexString;
  my_identity_pk_string: HexString;
}> => {
  seed = seed || ed.utils.randomPrivateKey();
  const privKey = new Uint8Array(seed);
  const pubKey = await ed.getPublicKey(privKey);

  const my_identity_sk_string: string = toHexString(privKey);
  const my_identity_pk_string: string = toHexString(pubKey);

  return {
    my_identity_sk_string,
    my_identity_pk_string,
  };
};

export async function encryptMessage(
  message: string,
  self_sk: Uint8Array,
  destination_pk: Uint8Array
): Promise<string> {
  await sodium.ready;

  const shared_secret = sharedKey(self_sk, destination_pk);
  const key = sodium.crypto_generichash(32, shared_secret);

  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_chacha20poly1305_IETF_NPUBBYTES
  );
  const plaintext_bytes = sodium.from_string(message);
  const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    plaintext_bytes,
    null,
    null,
    nonce,
    key
  );

  const encrypted_body = sodium.to_hex(nonce) + sodium.to_hex(ciphertext);
  return `encrypted:${encrypted_body}`;
}

export async function decryptMessage(
  encryptedBody: string,
  self_sk: Uint8Array,
  sender_pk: Uint8Array
): Promise<string | null> {
  await sodium.ready;

  const parts: string[] = encryptedBody.split(":");
  if (parts[0] !== "encrypted") {
    throw new Error("Unexpected variant");
  }

  const content = parts[1];
  const shared_secret = sharedKey(self_sk, sender_pk);
  const key = blake3(shared_secret);
  console.log("key", key);

  const content_len_bytes = sodium.from_hex(content.slice(0, 16));
  console.log("content_len_bytes", content_len_bytes);
  const schema_len_bytes = sodium.from_hex(content.slice(16, 32));
  console.log("schema_len_bytes", schema_len_bytes);
  let nonce = sodium.from_hex(content.slice(32, 32 + 24)); // Adjust nonce size to 12 bytes
  console.log("nonce", nonce);
  const ciphertext = sodium.from_hex(content.slice(32 + 24)); // Adjust slicing to match nonce size
  console.log("ciphertext", Array.from(ciphertext).join(", "));
  console.log("cipher length", ciphertext.length);

  try {
    const decipher = crypto.createDecipheriv("chacha20-poly1305", key, nonce, {
      authTagLength: 16,
    });
    decipher.setAuthTag(ciphertext.slice(-16));
    const plaintext_bytes = decipher.update(ciphertext.slice(0, -16));

    console.log("plaintext_bytes: ", plaintext_bytes);
    const decrypted_body = JSON.parse(sodium.to_string(plaintext_bytes));
    return decrypted_body;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      throw new Error("Decryption failure!: " + e.message);
    } else {
      throw new Error("Decryption failure!" + (e as any));
    }
  }
}

export async function encryptMessageWithPassphrase(
  message: string,
  passphrase: string
): Promise<string> {
  await sodium.ready;

  const salt = sodium.randombytes_buf(16); // Use a fixed length for the salt
  const key = sodium.crypto_pwhash(
    32,
    passphrase,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );

  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_chacha20poly1305_IETF_NPUBBYTES
  );
  const plaintext_bytes = sodium.from_string(message);
  const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    plaintext_bytes,
    null,
    null,
    nonce,
    key
  );

  const encrypted_body =
    sodium.to_hex(salt) + sodium.to_hex(nonce) + sodium.to_hex(ciphertext);
  return `encrypted:${encrypted_body}`;
}

export async function decryptMessageWithPassphrase(
  encryptedBody: string,
  passphrase: string
): Promise<string | null> {
  await sodium.ready;

  const parts: string[] = encryptedBody.split(":");
  if (parts[0] !== "encrypted") {
    throw new Error("Unexpected variant");
  }

  const content = parts[1];
  const salt = sodium.from_hex(content.slice(0, 32)); // Get the salt from the encrypted message
  const key = sodium.crypto_pwhash(
    32,
    passphrase,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );

  const nonce = sodium.from_hex(content.slice(32, 56));
  const ciphertext = sodium.from_hex(content.slice(56));

  try {
    const plaintext_bytes = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      key
    );
    const decrypted_body = sodium.to_string(plaintext_bytes);
    return decrypted_body;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      throw new Error("Decryption failure!: " + e.message);
    } else {
      throw new Error("Decryption failure!");
    }
  }
}
