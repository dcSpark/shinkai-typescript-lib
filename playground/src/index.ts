import { ShinkaiManager } from "./shinkai_manager";
import { postData } from "./utils";
import {
  MessageSchemaType,
  ShinkaiMessage,
  ShinkaiMessageBuilder,
  TSEncryptionMethod,
} from "@shinkai_protocol/shinkai-typescript-lib";

async function main() {
  const encryption_sk: string = "88b49468ed3ee4ea079f75eef9f651f09d3f18fd3a575c3c48d0052347462179";
  const signature_sk: string = "91adf9c548e3ea0ba3f3fa38ecd239c3bec0dc5a63dcb430746ec4c43160d97e";
  const receiver_pk =
    "798cbd64d78c4a0fba338b2a6349634940dc4e5b601db1029e02c41e0fe05679";
  const profile_name = "main";
  const device_name = "main_device";
  const node_name = "@@localhost.shinkai";

  const shinkai_manager: ShinkaiManager = new ShinkaiManager(
    encryption_sk,
    signature_sk,
    receiver_pk,
    node_name,
    profile_name,
    device_name
  );

  const message = await shinkai_manager.buildGetMessagesForInbox(
    "job_inbox::jobid_399c5571-3504-4aa7-a291-b1e086c1440c::false"
  );
  const messageCopy = JSON.parse(JSON.stringify(message));

  console.log("### Message tbs: ");
  console.log(messageCopy);

  const from_lib =
    '{"body":{"unencrypted":{"message_data":{"unencrypted":{"message_raw_content":"{\\"inbox\\":\\"job_inbox::jobid_399c5571-3504-4aa7-a291-b1e086c1440c::false\\",\\"count\\":10,\\"offset\\":null}","message_content_schema":"APIGetMessagesFromInboxRequest"}},"internal_metadata":{"sender_subidentity":"main","recipient_subidentity":"","inbox":"job_inbox::jobid_399c5571-3504-4aa7-a291-b1e086c1440c::false","signature":"3442c53db2a35243afefaa25acf1b21d3663696c8c51e7a502b65e6c7e330250da6f5558f3666dfbea1de51be83db767c2fb830f3d7fa87036f11514bd51f501","encryption":"None"}}},"external_metadata":{"sender":"main","recipient":"@@localhost.shinkai","scheduled_time":"2024-01-20T06:03:39.198Z","signature":"f4e2b43f0c02a6c2978b4e69984a12e991d5e46ea6806e8fb7f64a50539cfc0d333974dd2d0ddeddb93f4db41f71f4e034d19e5056ab5e9de46e3d0807f40f00","other":"","intra_sender":"main"},"encryption":"None","version":"V1_0"}';

  const message_job = await shinkai_manager.buildJobMessage(
    "hello hello, are u there?",
    "jobid_41e6c976-afdf-40b6-a8e0-a7d19ed5579e"
  );

  console.log("### Message job: ");
  console.log(message_job);
  console.log(JSON.stringify(message_job));

  let resp = await postData(message_job, "/v1/job_message");
  console.log("### Response:");
  // console.log(resp);
}

main();