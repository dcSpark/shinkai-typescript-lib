class InboxNameError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = "InboxNameError";
    }
}