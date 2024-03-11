import { InboxName, InboxNameError } from "../src/schemas/inbox_name";

describe("InboxName", () => {
  test("valid_inbox_names", () => {
    const validNames = [
      "inbox::@@node.shinkai::true",
      "inbox::@@node1.shinkai/subidentity::false",
      "inbox::@@alice.shinkai/profileName/agent/myChatGPTAgent::true",
      "inbox::@@alice.shinkai/profileName/device/myPhone::true",
      "inbox::@@node1.shinkai/subidentity::@@node2.shinkai/subidentity2::false",
      "inbox::@@node1.shinkai/subidentity::@@node2.shinkai/subidentity::@@node3.shinkai/subidentity2::false",
      // add other valid examples here...
    ];

    for (const name of validNames) {
      expect(() => InboxName.parseInboxName(name)).not.toThrow();
    }
  });

  test("invalid_inbox_names", () => {
    const invalidNames = [
      "@@node1.shinkai::false",
      "inbox::@@node1.shinkai::falsee",
      "@@node1.shinkai",
      "inbox::@@node1.shinkai",
      "inbox::node1::false",
      "inbox::node1.shinkai::false",
      "inbox::@@node1::false",
      "inbox::@@node1.shinkai//subidentity::@@node2.shinkai::false",
      "inbox::@@node1/subidentity::false",
      // add other invalid examples here...
    ];

    for (const name of invalidNames) {
      expect(() => InboxName.parseInboxName(name)).toThrow();
    }
  });

  describe("InboxName getId method", () => {
    it("extracts SOME_ID correctly for simple inbox format", () => {
      const inbox = new InboxName("inbox::simpleId::true", false);
      expect(inbox.getUniqueId()).toBe("simpleId");
    });

    it("extracts SOME_ID correctly for inbox format with separator in ID", () => {
      const inbox = new InboxName("inbox::complex::Id::true", false);
      expect(inbox.getUniqueId()).toBe("complex::Id");
    });

    it("extracts SOME_ID correctly for simple job_inbox format", () => {
      const jobInbox = new InboxName("job_inbox::uniqueId::false", false);
      expect(jobInbox.getUniqueId()).toBe("uniqueId");
    });

    it("extracts SOME_ID correctly for job_inbox format with separator in ID", () => {
      const jobInbox = new InboxName("job_inbox::unique::Id::false", false);
      expect(jobInbox.getUniqueId()).toBe("unique::Id");
    });

    it("throws an error for invalid inbox name format", () => {
      const invalidInbox = new InboxName("invalidFormat", false);
      expect(() => invalidInbox.getUniqueId()).toThrow(InboxNameError);
    });
  });
});
