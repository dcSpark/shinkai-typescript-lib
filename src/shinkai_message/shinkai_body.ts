import { InternalMetadata } from "./shinkai_internal_metadata";
import { MessageData } from "./shinkai_message_data";

export interface ShinkaiBody {
  message_data: MessageData;
  internal_metadata: InternalMetadata;
}
