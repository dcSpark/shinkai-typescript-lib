import { EncryptedShinkaiData } from "./encrypted_shinkai_data";
import { ShinkaiData } from "./shinkai_data";

export type MessageData = { encrypted: EncryptedShinkaiData } | { unencrypted: ShinkaiData };