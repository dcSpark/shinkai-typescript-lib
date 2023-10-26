import { ShinkaiMessage } from "../shinkai_message/shinkai_message";

class ShinkaiSubidentityType {
  static Agent = "agent";
  static Device = "device";
}

class ShinkaiNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShinkaiNameError";
  }
}

class ShinkaiName {
  fullName: string;
  nodeName: string;
  profileName: string | null;
  subidentityType: string | null;
  subidentityName: string | null;

  constructor(rawName: string) {
    const correctedName = ShinkaiName.correctNodeName(rawName);
    // Add your own validation logic here...

    const parts = correctedName.split("/");
    this.nodeName = parts[0];
    this.profileName = parts.length > 1 ? parts[1] : null;
    this.subidentityType = parts.length > 2 ? parts[2] : null;
    this.subidentityName = parts.length > 3 ? parts[3] : null;

    this.fullName = correctedName.toLowerCase();
    if (this.nodeName) this.nodeName = this.nodeName.toLowerCase();
    if (this.profileName) this.profileName = this.profileName.toLowerCase();
  }

  static isFullyValid(shinkaiName: string): boolean {
    try {
      this.validateName(shinkaiName);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        console.info(`Validation error: ${err.message}`);
      }
      return false;
    }
  }

  static validateName(rawName: string): void {
    const parts = rawName.split("/");

    if (!(parts.length >= 1 && parts.length <= 4)) {
      console.error(
        `Name should have one to four parts: node, profile, type (device or agent), and name: ${rawName}`
      );
      throw new Error(
        "Name should have one to four parts: node, profile, type (device or agent), and name."
      );
    }

    if (!parts[0].startsWith("@@") || !parts[0].endsWith(".shinkai")) {
      console.error(`Validation error: ${rawName}`);
      throw new Error(
        "Node part of the name should start with '@@' and end with '.shinkai'."
      );
    }

    const nodeRegex = /^@@[a-zA-Z0-9_\.]+\.shinkai$/;
    if (!nodeRegex.test(parts[0])) {
      console.error(
        `Node part of the name contains invalid characters: ${rawName}`
      );
      throw new Error("Node part of the name contains invalid characters.");
    }

    const partRegex = /^[a-zA-Z0-9_]*$/;

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];

      if (index === 0) {
        if (part.includes("/")) {
          console.error(`Root node name cannot contain '/': ${rawName}`);
          throw new Error("Root node name cannot contain '/'.");
        }
        continue;
      }

      if (
        index === 2 &&
        !(
          part === ShinkaiSubidentityType.Agent ||
          part === ShinkaiSubidentityType.Device
        )
      ) {
        console.error(
          `The third part should either be 'agent' or 'device': ${rawName}`
        );
        throw new Error("The third part should either be 'agent' or 'device'.");
      }

      if (index === 3 && !partRegex.test(part)) {
        console.error(
          `The fourth part (name after 'agent' or 'device') should be alphanumeric or underscore: ${rawName}`
        );
        throw new Error(
          "The fourth part (name after 'agent' or 'device') should be alphanumeric or underscore."
        );
      }

      if (
        index !== 0 &&
        index !== 2 &&
        (!partRegex.test(part) || part.includes(".shinkai"))
      ) {
        console.error(
          `Name parts should be alphanumeric or underscore and not contain '.shinkai': ${rawName}`
        );
        throw new Error(
          "Name parts should be alphanumeric or underscore and not contain '.shinkai'."
        );
      }
    }

    if (
      parts.length === 3 &&
      (parts[2] === ShinkaiSubidentityType.Agent ||
        parts[2] === ShinkaiSubidentityType.Device)
    ) {
      console.error(
        `If type is 'agent' or 'device', a fourth part is expected: ${rawName}`
      );
      throw new Error(
        "If type is 'agent' or 'device', a fourth part is expected."
      );
    }
  }

  static fromNodeName(nodeName: string): ShinkaiName {
    // Ensure the nodeName has no forward slashes
    if (nodeName.includes("/")) {
      throw new Error(`Invalid name format: ${nodeName}`);
    }

    // Use the existing constructor to handle the rest of the formatting and checks
    return new ShinkaiName(nodeName);
  }

  static fromNodeAndProfile(
    nodeName: string,
    profileName: string
  ): ShinkaiName {
    // Validate and format the nodeName
    nodeName = ShinkaiName.correctNodeName(nodeName);

    // Construct the fullIdentityName
    const fullIdentityName = `${nodeName.toLowerCase()}/${profileName.toLowerCase()}`;

    // Create a new ShinkaiName
    return new ShinkaiName(fullIdentityName);
  }

  static fromNodeAndProfileAndTypeAndName(
    nodeName: string,
    profileName: string,
    shinkaiType: ShinkaiSubidentityType,
    name: string
  ): ShinkaiName {
    // Validate and format the nodeName
    nodeName = ShinkaiName.correctNodeName(nodeName);

    // Construct the fullIdentityName
    const fullIdentityName = `${nodeName.toLowerCase()}/${profileName.toLowerCase()}/${shinkaiType}/${name.toLowerCase()}`;

    // Create a new ShinkaiName
    return new ShinkaiName(fullIdentityName);
  }

  static fromShinkaiMessageUsingSenderAndIntraSender(
    message: ShinkaiMessage
  ): ShinkaiName {
    const name = `${message.external_metadata.sender}/${message.external_metadata.intra_sender}`;
    return new ShinkaiName(name);
  }

  static fromShinkaiMessageOnlyUsingSenderNodeName(
    message: ShinkaiMessage
  ): ShinkaiName {
    return new ShinkaiName(message.external_metadata.sender);
  }

  static fromShinkaiMessageOnlyUsingRecipientNodeName(
    message: ShinkaiMessage
  ): ShinkaiName {
    return new ShinkaiName(message.external_metadata.recipient);
  }

  static fromShinkaiMessageUsingSenderSubidentity(
    message: ShinkaiMessage
  ): ShinkaiName {
    // Check if outer encrypted and return error if so
    if (message.body.type !== "Unencrypted") {
      throw new Error("Message body missing");
    }

    let node;
    try {
      node = new ShinkaiName(message.external_metadata.sender);
    } catch {
      throw new Error(
        `Invalid name format: ${message.external_metadata.sender}`
      );
    }

    const senderSubidentity = message.body.internal_metadata.senderSubidentity
      ? `/${message.body.internal_metadata.senderSubidentity}`
      : "";

    try {
      return new ShinkaiName(`${node}${senderSubidentity}`);
    } catch {
      throw new Error(`Invalid name format: ${node}${senderSubidentity}`);
    }
  }

  static fromShinkaiMessageUsingRecipientSubidentity(
    message: ShinkaiMessage
  ): ShinkaiName {
    // Check if the message is encrypted
    if (message.body.type !== "Unencrypted") {
      throw new Error("Cannot process encrypted ShinkaiMessage");
    }

    let node;
    try {
      node = new ShinkaiName(message.external_metadata.recipient);
    } catch {
      throw new Error(
        `Invalid name format: ${message.external_metadata.recipient}`
      );
    }

    const recipientSubidentity = message.body.internal_metadata
      .recipientSubidentity
      ? `/${message.body.internal_metadata.recipientSubidentity}`
      : "";

    try {
      return new ShinkaiName(`${node}${recipientSubidentity}`);
    } catch {
      throw new Error(`Invalid name format: ${node}${recipientSubidentity}`);
    }
  }

  static isValidNodeIdentityNameAndNoSubidentities(name: string): boolean {
    // A node name is valid if it starts with '@@', ends with '.shinkai', and doesn't contain '/'
    return (
      name.startsWith("@@") && name.endsWith(".shinkai") && !name.includes("/")
    );
  }

  contains(other: ShinkaiName): boolean {
    const selfParts = this.fullName.split("/");
    const otherParts = other.fullName.split("/");

    if (selfParts.length > otherParts.length) {
      return false;
    }

    return selfParts.every((part, index) => part === otherParts[index]);
  }

  hasProfile(): boolean {
    return this.profileName !== undefined;
  }

  hasDevice(): boolean {
    return this.subidentityType === ShinkaiSubidentityType.Device;
  }

  hasAgent(): boolean {
    return this.subidentityType === ShinkaiSubidentityType.Agent;
  }

  hasNoSubidentities(): boolean {
    return this.profileName === undefined && this.subidentityType === undefined;
  }

  getProfileName(): string | null {
    return this.profileName;
  }

  getNodeName(): string {
    return this.nodeName;
  }

  getDeviceName(): string | null {
    return this.hasDevice() ? this.subidentityName : null;
  }

  //
  static correctNodeName(rawName: string): string {
    let parts = rawName.split("/", 2);
    let nodeName = parts[0];

    if (!nodeName.startsWith("@@")) {
      nodeName = "@@" + nodeName;
    }

    if (!nodeName.endsWith(".shinkai")) {
      nodeName = nodeName + ".shinkai";
    }

    let correctedName = parts.length > 1 ? nodeName + "/" + parts[1] : nodeName;

    return correctedName;
  }
}

// ... other classes and functions, similar to the Rust version, but using JavaScript/TypeScript syntax
