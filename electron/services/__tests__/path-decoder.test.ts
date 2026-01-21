import { decodeProjectPath, getProjectName, encodeProjectPath } from "../path-decoder";

describe("path-decoder", () => {
  describe("decodeProjectPath", () => {
    it("decodes simple path with Users directory", () => {
      expect(decodeProjectPath("-Users-name-project")).toBe("/Users/name/project");
    });

    it("decodes path with home directory", () => {
      expect(decodeProjectPath("-home-user-code")).toBe("/home/user/code");
    });

    it("decodes deeply nested path", () => {
      expect(decodeProjectPath("-Users-name-Documents-projects-myapp")).toBe(
        "/Users/name/Documents/projects/myapp"
      );
    });

    it("handles path with single segment", () => {
      expect(decodeProjectPath("-Users")).toBe("/Users");
    });

    it("handles Windows-style paths encoded", () => {
      // In case Windows paths get encoded similarly
      expect(decodeProjectPath("-C:-Users-name-project")).toBe("/C:/Users/name/project");
    });

    it("handles path with numbers", () => {
      expect(decodeProjectPath("-home-user123-project456")).toBe("/home/user123/project456");
    });
  });

  describe("getProjectName", () => {
    it("extracts project name from decoded path", () => {
      expect(getProjectName("/Users/name/my-project")).toBe("my-project");
    });

    it("extracts name from deeply nested path", () => {
      expect(getProjectName("/home/user/Documents/projects/app")).toBe("app");
    });

    it("returns Unknown for root path", () => {
      expect(getProjectName("/")).toBe("Unknown");
    });

    it("returns Unknown for empty path", () => {
      expect(getProjectName("")).toBe("Unknown");
    });

    it("handles paths with trailing slash", () => {
      // After splitting and filtering, empty strings are removed
      expect(getProjectName("/Users/name/project/")).toBe("project");
    });

    it("handles single segment path", () => {
      expect(getProjectName("/project")).toBe("project");
    });
  });

  describe("encodeProjectPath", () => {
    it("encodes simple path", () => {
      expect(encodeProjectPath("/Users/name/project")).toBe("-Users-name-project");
    });

    it("encodes path with home directory", () => {
      expect(encodeProjectPath("/home/user/code")).toBe("-home-user-code");
    });

    it("is inverse of decodeProjectPath", () => {
      const original = "-Users-name-Documents-project";
      const decoded = decodeProjectPath(original);
      const reencoded = encodeProjectPath(decoded);
      expect(reencoded).toBe(original);
    });

    it("handles deeply nested paths", () => {
      const path = "/Users/name/Documents/projects/myapp";
      expect(encodeProjectPath(path)).toBe("-Users-name-Documents-projects-myapp");
    });
  });

  describe("round-trip encoding/decoding", () => {
    const testCases = [
      "-Users-john-projects-webapp",
      "-home-dev-workspace-api",
      "-Users-name-Documents-Code-project123",
    ];

    testCases.forEach((encoded) => {
      it(`round-trips correctly: ${encoded}`, () => {
        const decoded = decodeProjectPath(encoded);
        const reencoded = encodeProjectPath(decoded);
        expect(reencoded).toBe(encoded);
      });
    });
  });
});
