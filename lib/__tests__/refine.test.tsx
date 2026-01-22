import {
  refineDataProvider,
  refineResources,
  refineOptions,
  refineRouterProvider,
} from "../refine";

describe("refineDataProvider", () => {
  describe("getList", () => {
    it("throws error for unsupported resource", async () => {
      await expect(
        refineDataProvider.getList({
          resource: "unsupported-resource",
        })
      ).rejects.toThrow('Resource "unsupported-resource" not supported');
    });

    it("returns empty array for projects when not in Electron", async () => {
      const result = await refineDataProvider.getList({
        resource: "projects",
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("getOne", () => {
    it("throws error for unsupported resource", async () => {
      await expect(
        refineDataProvider.getOne({
          resource: "unsupported-resource",
          id: "test",
          meta: {},
        })
      ).rejects.toThrow('Resource "unsupported-resource" not supported');
    });
  });

  describe("create", () => {
    it("throws error for unsupported resource", async () => {
      await expect(
        refineDataProvider.create({
          resource: "projects",
          variables: { name: "Test" },
          meta: {},
        })
      ).rejects.toThrow('Create operation not supported for resource "projects"');
    });
  });

  describe("update", () => {
    it("throws error for unsupported resource", async () => {
      await expect(
        refineDataProvider.update({
          resource: "sessions",
          id: "test",
          variables: { name: "Updated" },
          meta: {},
        })
      ).rejects.toThrow('Update operation not supported for resource "sessions"');
    });
  });

  describe("deleteOne", () => {
    it("throws error for unsupported resource", async () => {
      await expect(
        refineDataProvider.deleteOne({
          resource: "projects",
          id: "test",
          meta: {},
        })
      ).rejects.toThrow('Delete operation not supported for resource "projects"');
    });
  });

  describe("getApiUrl", () => {
    it("returns ipc://electron", () => {
      expect(refineDataProvider.getApiUrl()).toBe("ipc://electron");
    });
  });
});

describe("refineResources", () => {
  it("includes projects resource", () => {
    const projectResource = refineResources.find((r) => r.name === "projects");
    expect(projectResource).toBeDefined();
    expect(projectResource?.list).toBe("/projects");
    expect(projectResource?.show).toBe("/projects/:id");
  });

  it("includes sessions resource", () => {
    const sessionResource = refineResources.find((r) => r.name === "sessions");
    expect(sessionResource).toBeDefined();
    expect(sessionResource?.list).toBe("/sessions");
    expect(sessionResource?.show).toBe("/sessions/:id");
  });

  it("is an array", () => {
    expect(Array.isArray(refineResources)).toBe(true);
  });
});

describe("refineOptions", () => {
  it("has correct default options", () => {
    expect(refineOptions.syncWithLocation).toBe(true);
    expect(refineOptions.warnWhenUnsavedChanges).toBe(true);
    expect(refineOptions.useNewQueryKeys).toBe(true);
    expect(refineOptions.projectId).toBe("clocked");
    expect(refineOptions.disableTelemetry).toBe(true);
  });
});

describe("refineRouterProvider", () => {
  it("is defined", () => {
    expect(refineRouterProvider).toBeDefined();
  });
});
