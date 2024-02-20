import { ShinkaiName } from "../src/schemas/shinkai_name";

describe("ShinkaiName", () => {
  describe("Validation and Parsing", () => {
    it.each([
      // Include expected outcomes in the test cases
      [
        "@@alice.shinkai",
        {
          nodeName: "@@alice.shinkai",
          profileName: null,
          subidentityType: null,
          subidentityName: null,
          fullName: "@@alice.shinkai",
        },
      ],
      [
        "@@alice.sepolia-shinkai",
        {
          nodeName: "@@alice.sepolia-shinkai",
          profileName: null,
          subidentityType: null,
          subidentityName: null,
          fullName: "@@alice.sepolia-shinkai",
        },
      ],
      [
        "@@ALICE.SHINKAI",
        {
          nodeName: "@@alice.shinkai",
          profileName: null,
          subidentityType: null,
          subidentityName: null,
          fullName: "@@alice.shinkai",
        },
      ],
      [
        "@@alice_in_chains.shinkai",
        {
          nodeName: "@@alice_in_chains.shinkai",
          profileName: null,
          subidentityType: null,
          subidentityName: null,
          fullName: "@@alice_in_chains.shinkai",
        },
      ],
      [
        "@@alice.shinkai/profileName",
        {
          nodeName: "@@alice.shinkai",
          profileName: "profilename",
          subidentityType: null,
          subidentityName: null,
          fullName: "@@alice.shinkai/profilename",
        },
      ],
      [
        "@@alice.shinkai/profileName/agent/myChatGPTAgent",
        {
          nodeName: "@@alice.shinkai",
          profileName: "profilename",
          subidentityType: "agent",
          subidentityName: "mychatgptagent",
          fullName: "@@alice.shinkai/profilename/agent/mychatgptagent",
        },
      ],
      [
        "@@alice.sepolia-shinkai/profileName/agent/myChatGPTAgent",
        {
          nodeName: "@@alice.sepolia-shinkai",
          profileName: "profilename",
          subidentityType: "agent",
          subidentityName: "mychatgptagent",
          fullName: "@@alice.sepolia-shinkai/profilename/agent/mychatgptagent",
        },
      ],
      [
        "@@alice.shinkai/profileName/device/myPhone",
        {
          nodeName: "@@alice.shinkai",
          profileName: "profilename",
          subidentityType: "device",
          subidentityName: "myphone",
          fullName: "@@alice.shinkai/profilename/device/myphone",
        },
      ],
      [
        "@@localhost.shinkai/profileName/agent/STANDARD_TEXT",
        {
          nodeName: "@@localhost.shinkai",
          profileName: "profilename",
          subidentityType: "agent",
          subidentityName: "standard_text",
          fullName: "@@localhost.shinkai/profilename/agent/standard_text",
        },
      ],
    ])(
      "should validate and parse valid Shinkai names: %s",
      (name, expected) => {
        const shinkaiName = new ShinkaiName(name);
        console.log(`Creating new ShinkaiName for ${name} with: `, shinkaiName);
        // Check that no error is thrown
        expect(() => new ShinkaiName(name)).not.toThrow();
        // Check each property against the expected values
        expect(shinkaiName.nodeName).toBe(expected.nodeName);
        expect(shinkaiName.profileName).toBe(expected.profileName);
        expect(shinkaiName.subidentityType).toBe(expected.subidentityType);
        expect(shinkaiName.subidentityName).toBe(expected.subidentityName);
        expect(shinkaiName.getValue()).toBe(expected.fullName);
      }
    );

    it.each([
      // Invalid because it includes an unexpected segment 'myPhone' without a subidentity type
      "@@alice.shinkai/profileName/myPhone",
      // Invalid because it contains illegal characters '!'.
      "@@al!ce.shinkai",
      // Invalid because 'subidentity' is used without a profile name or subidentity type.
      "@@alice/subidentity",
      // Invalid because it ends with '//', indicating an incomplete subidentity part.
      "@@alice.shinkai//",
      // Invalid because it contains '//subidentity' without a proper subidentity type.
      "@@alice.shinkai//subidentity",
      // Invalid because 'profile_1.shinkai' is not a valid profile name.
      "@@node1.shinkai/profile_1.shinkai",
    ])(
      "should return false for isFullyValid with invalid names: %s",
      (name) => {
        expect(ShinkaiName.isFullyValid(name)).toBe(false);
      }
    );

    it.each([
      "@@alice.shinkai/profileName/myPhone",
      "@@al!ce.shinkai",
      "@@alice/subidentity",
      "@@alice.shinkai//",
      "@@alice.shinkai//subidentity",
      "@@node1.shinkai/profile_1.shinkai",
    ])(
      "should return false for isFullyValid with invalid names: %s",
      (name) => {
        expect(ShinkaiName.isFullyValid(name)).toBe(false);
      }
    );

    it("should correct and format name without Shinkai suffix", () => {
      const name = "@@alice";
      const shinkaiName = new ShinkaiName(name);
      expect(shinkaiName.getValue()).toBe("@@alice.shinkai");
    });

    it("should correct and format name without Shinkai prefix", () => {
      const name = "alice.shinkai";
      const shinkaiName = new ShinkaiName(name);
      expect(shinkaiName.getValue()).toBe("@@alice.shinkai");
    });

    it("should handle profile inclusion correctly", () => {
      const shinkaiName = new ShinkaiName("@@charlie.shinkai/profileCharlie");
      expect(shinkaiName.hasProfile()).toBe(true);
    });

    it("should handle device inclusion correctly", () => {
      const shinkaiName = new ShinkaiName(
        "@@dave.shinkai/profileDave/device/myDevice"
      );
      expect(shinkaiName.hasDevice()).toBe(true);
    });

    it("should identify names without subidentities correctly", () => {
      const shinkaiName = new ShinkaiName("@@eve.shinkai");
      console.log(shinkaiName);
      expect(shinkaiName.hasNoSubidentities()).toBe(true);
    });

    it("should extract profile name correctly", () => {
      const shinkaiName = new ShinkaiName("@@frank.shinkai/profileFrank");
      expect(shinkaiName.getProfileName()).toBe("profilefrank");
    });

    it("should extract node correctly", () => {
      const shinkaiName = new ShinkaiName(
        "@@henry.shinkai/profileHenry/device/myDevice"
      );
      const node = shinkaiName.extractNode();
      expect(node.getValue()).toBe("@@henry.shinkai");
    });

    it("should correctly determine containment relationships", () => {
      const alice = new ShinkaiName("@@alice.shinkai");
      const aliceProfile = new ShinkaiName("@@alice.shinkai/profileName");
      expect(alice.contains(aliceProfile)).toBe(true);
    });

    it("should correctly identify non-containment relationships", () => {
      const alice = new ShinkaiName("@@alice.shinkai");
      const bob = new ShinkaiName("@@bob.shinkai");
      expect(alice.contains(bob)).toBe(false);
    });
  });
});
