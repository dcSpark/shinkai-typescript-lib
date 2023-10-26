class InboxName {
    constructor(public value: string, public isE2E: boolean, public identities: ShinkaiName[]) {}

    static new(inboxName: string): InboxName | InboxNameError {
        inboxName = inboxName.toLowerCase();
        const parts: string[] = inboxName.split("::");
        if (parts.length < 3 || parts.length > 101) {
            return new InboxNameError(`Invalid inbox name format: ${inboxName}`);
        }

        const isE2E = parts[parts.length - 1] === "true";

        if (parts[0] === "inbox") {
            const identities: ShinkaiName[] = [];
            for (let i = 1; i < parts.length - 1; i++) {
                if (!ShinkaiName.is_fully_valid(parts[i])) {
                    return new InboxNameError(`Invalid inbox name format: ${inboxName}`);
                }
                identities.push(new ShinkaiName(parts[i]));
            }

            return new InboxName(inboxName, isE2E, identities);
        } else if (parts[0] === "job_inbox") {
            if (isE2E) {
                return new InboxNameError(`Invalid inbox name format: ${inboxName}`);
            }
            const uniqueId = parts[1];
            if (uniqueId === "") {
                return new InboxNameError(`Invalid inbox name format: ${inboxName}`);
            }
            return new JobInbox(inboxName, uniqueId, isE2E);
        } else {
            return new InboxNameError(`Invalid inbox name format: ${inboxName}`);
        }
    }

    static fromMessage(message: ShinkaiMessage): InboxName | InboxNameError {
        if ('internal_metadata' in message.body) {
            const inboxName = message.body.internal_metadata.inbox;
            return InboxName.new(inboxName);
        } else {
            return new InboxNameError("Expected Unencrypted MessageBody");
        }
    }

    hasCreationAccess(identityName: ShinkaiName): boolean {
        for (let identity of this.identities) {
            if (identity.contains(identityName)) {
                return true;
            }
        }
        return false;
    }

    // ... other methods
}