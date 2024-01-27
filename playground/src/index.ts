import { ShinkaiManager } from "./shinkai_manager";
import { postData } from "./utils";
import {
  MessageSchemaType,
  ShinkaiMessage,
  ShinkaiMessageBuilder,
  TSEncryptionMethod,
} from "@shinkai_protocol/shinkai-typescript-lib";

async function sendMessage(shinkai_manager: ShinkaiManager, content: string, job_id: string) {
  const message_job = await shinkai_manager.buildJobMessage(
    content,
    job_id
  );

  let resp = await postData(message_job, "/v1/job_message");
  console.log("### Response:");
  console.log(resp);
}

async function getMessages(shinkai_manager: ShinkaiManager, inbox: string) {

}

async function getInboxes(shinkai_manager: ShinkaiManager) {
  const message = await shinkai_manager.buildGetInboxes();
  let resp = await postData(message, "/v1/get_all_smart_inboxes_for_profile");
  console.log(resp);
}

async function main() {
  // Shinkai Node1
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

  await getInboxes(shinkai_manager);
  // console.log(resp);
}

main();