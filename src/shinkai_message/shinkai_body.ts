import { sign_inner_layer, verify_inner_layer_signature } from "../cryptography/shinkai_signing";
import { InternalMetadata } from "./shinkai_internal_metadata";
import { MessageData } from "./shinkai_message_data";

export interface ShinkaiBody {
  message_data: MessageData;
  internal_metadata: InternalMetadata;

  verify_inner_layer_signature(self_pk: Uint8Array): Promise<boolean>;
  sign_inner_layer(self_sk: Uint8Array): Promise<ShinkaiBody>;
}

export class ShinkaiBodyImpl implements ShinkaiBody {
  message_data: MessageData;
  internal_metadata: InternalMetadata;

  constructor(message_data: MessageData, internal_metadata: InternalMetadata) {
    this.message_data = message_data;
    this.internal_metadata = internal_metadata;
  }

  async verify_inner_layer_signature(self_pk: Uint8Array): Promise<boolean> {
    return verify_inner_layer_signature(self_pk, this);
  }

  async sign_inner_layer(self_sk: Uint8Array): Promise<ShinkaiBody> {
    const body_clone = new ShinkaiBodyImpl(this.message_data, this.internal_metadata);
    body_clone.internal_metadata.signature = (await sign_inner_layer(self_sk, this)).signature;
    return body_clone;
  }
}