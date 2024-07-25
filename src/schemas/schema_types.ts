import { ShinkaiMessage } from "../shinkai_message/shinkai_message";

export enum TSEncryptionMethod {
  DiffieHellmanChaChaPoly1305 = "DiffieHellmanChaChaPoly1305",
  None = "None",
}

export enum MessageSchemaType {
  JobCreationSchema = "JobCreationSchema",
  JobMessageSchema = "JobMessageSchema",
  PreMessageSchema = "PreMessageSchema",
  CreateRegistrationCode = "CreateRegistrationCode",
  UseRegistrationCode = "UseRegistrationCode",
  APIGetMessagesFromInboxRequest = "APIGetMessagesFromInboxRequest",
  APIReadUpToTimeRequest = "APIReadUpToTimeRequest",
  APIAddAgentRequest = "APIAddAgentRequest",
  TextContent = "TextContent",
  SymmetricKeyExchange = "SymmetricKeyExchange",
  Empty = "Empty",
  VecFsRetrievePathSimplifiedJson = "VecFsRetrievePathSimplifiedJson",
  VecFsRetrieveVectorResource = "VecFsRetrieveVectorResource",
  VecFsRetrieveVectorSearchSimplifiedJson = "VecFsRetrieveVectorSearchSimplifiedJson",
  VecFsCreateFolder = "VecFsCreateFolder",
  VecFsDeleteFolder = "VecFsDeleteFolder",
  VecFsMoveFolder = "VecFsMoveFolder",
  VecFsCopyFolder = "VecFsCopyFolder",
  VecFsCreateItem = "VecFsCreateItem",
  VecFsMoveItem = "VecFsMoveItem",
  VecFsCopyItem = "VecFsCopyItem",
  ConvertFilesAndSaveToFolder = "ConvertFilesAndSaveToFolder",
  CreateShareableFolder = "CreateShareableFolder",
  AvailableSharedItems = "AvailableSharedItems",
  SubscribeToSharedFolder = "SubscribeToSharedFolder",
  UnsubscribeToSharedFolder = "UnsubscribeToSharedFolder",
  MySubscriptions = "MySubscriptions",
}

export interface JobScope {
  local_vrkai: string[];
  local_vrpack: string[];
  vector_fs_items: [];
  vector_fs_folders: VectorFSFolderScopeEntry[];
  network_folders: [];
}

export interface JobCreation {
  scope: JobScope;
  is_hidden?: boolean;
}

export interface JobMessage {
  job_id: string;
  content: string;
}

export interface JobToolCall {
  tool_id: string;
  inputs: Record<string, string>;
}

export enum JobRecipient {
  SelfNode = "SelfNode",
  User = "User",
  ExternalIdentity = "ExternalIdentity",
}

export interface JobPreMessage {
  tool_calls: JobToolCall[];
  content: string;
  recipient: JobRecipient;
}

export interface APIGetMessagesFromInboxRequest {
  inbox: string;
  count: number;
  offset?: string;
}

export interface APIReadUpToTimeRequest {
  inbox_name: string;
  up_to_time: string;
}

export interface SerializedAgent {
  id: string;
  full_identity_name: string; // ShinkaiName
  perform_locally: boolean;
  external_url?: string;
  api_key?: string;
  model: AgentAPIModel;
  toolkit_permissions: string[];
  storage_bucket_permissions: string[];
  allowed_message_senders: string[];
}
export interface AgentAPIModel {
  OpenAI?: OpenAI;
  ClaudeAI?: ClaudeAI;
  GenericAPI?: GenericAPI;
  Ollama?: Ollama;
  ShinkaiBackend?: ShinkaiBackend;
  LocalLLM?: LocalLLM;
}

export interface ClaudeAI {
  model_type: string;
}
export interface OpenAI {
  model_type: string;
}

export interface GenericAPI {
  model_type: string;
}

export interface Ollama {
  model_type: string;
}

export interface ShinkaiBackend {
  model_type: string;
}

export interface LocalLLM {
  model_type: string;
}

export interface APIAddAgentRequest {
  agent: SerializedAgent;
}

export interface RegistrationCode {
  code: string;
  profileName: string;
  identityPk: string;
  encryptionPk: string;
  permissionType: string;
}

export interface APIVecFsRetrievePathSimplifiedJson {
  path: string;
}

export interface APIConvertFilesAndSaveToFolder {
  path: string;
  file_inbox: string;
}

export interface APIVecFSRetrieveVectorResource {
  path: string;
}

export interface APIVecFsRetrieveVectorSearchSimplifiedJson {
  search: string;
  path?: string;
  max_results?: number;
  max_files_to_scan?: number;
}

export interface APIVecFsCreateFolder {
  path: string;
  folder_name: string;
}

export interface APIVecFsDeleteFolder {
  path: string;
  folder_name: string;
}

export interface APIVecFsMoveFolder {
  origin_path: string;
  destination_path: string;
}

export interface APIVecFsCopyFolder {
  origin_path: string;
  destination_path: string;
}

export interface APIVecFsCreateItem {
  path: string;
  item_name: string;
  item_content: string;
}

export interface APIVecFsMoveItem {
  origin_path: string;
  destination_path: string;
}

export interface APIVecFsCopyItem {
  origin_path: string;
  destination_path: string;
}

export interface TopicSubscription {
  topic: WSTopic;
  subtopic?: string;
}

export interface WSMessage {
  subscriptions: TopicSubscription[];
  unsubscriptions: TopicSubscription[];
  shared_key?: string;
}

export interface WSMessageResponse {
  subscriptions: TopicSubscription[];
  shinkai_message: ShinkaiMessage;
}

export enum WSTopic {
  Inbox = "inbox",
  SmartInboxes = "smart_inboxes",
}

export interface APICreateShareableFolder {
  path: string;
  subscription_req: FolderSubscription;
}

export interface FolderSubscription {
  minimum_token_delegation?: number;
  minimum_time_delegated_hours?: number;
  monthly_payment?: PaymentOption;
  is_free: boolean;
}

export interface VectorFSFolderScopeEntry {
  name: string;
  path: string;
}

export type PaymentOption = 
  | { type: 'USD', amount: number }
  | { type: 'KAITokens', amount: number };

export enum SubscriptionPayment {
  Free = "Free",
  DirectDelegation = "DirectDelegation",
  Payment = "Payment",
}