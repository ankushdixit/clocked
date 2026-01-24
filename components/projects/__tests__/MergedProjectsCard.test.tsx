/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MergedProjectsCard } from "../MergedProjectsCard";
import type { Project } from "@/types/electron";

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  path: "/Users/test/project",
  name: "test-project",
  firstActivity: "2024-01-01T10:00:00Z",
  lastActivity: "2024-01-15T15:30:00Z",
  sessionCount: 5,
  messageCount: 100,
  totalTime: 3600000,
  isHidden: false,
  groupId: null,
  mergedInto: null,
  ...overrides,
});

describe("MergedProjectsCard", () => {
  describe("Rendering", () => {
    it("returns null when no merged projects", () => {
      const { container } = render(<MergedProjectsCard mergedProjects={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders card title", () => {
      const projects = [createMockProject()];
      render(<MergedProjectsCard mergedProjects={projects} />);
      expect(screen.getByText("Merged Projects")).toBeInTheDocument();
    });

    it("renders merged projects count badge", () => {
      const projects = [
        createMockProject({ path: "/p1", name: "project-1" }),
        createMockProject({ path: "/p2", name: "project-2" }),
      ];
      render(<MergedProjectsCard mergedProjects={projects} />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("renders all merged project names", () => {
      const projects = [
        createMockProject({ path: "/p1", name: "project-alpha" }),
        createMockProject({ path: "/p2", name: "project-beta" }),
      ];
      render(<MergedProjectsCard mergedProjects={projects} />);
      expect(screen.getByText("project-alpha")).toBeInTheDocument();
      expect(screen.getByText("project-beta")).toBeInTheDocument();
    });

    it("renders project paths", () => {
      const projects = [createMockProject({ path: "/Users/test/my-project", name: "my-project" })];
      render(<MergedProjectsCard mergedProjects={projects} />);
      expect(screen.getByText("/Users/test/my-project")).toBeInTheDocument();
    });

    it("renders project stats", () => {
      const projects = [
        createMockProject({
          sessionCount: 10,
          totalTime: 7200000, // 2 hours
          messageCount: 500,
        }),
      ];
      render(<MergedProjectsCard mergedProjects={projects} />);
      expect(screen.getByText("10 sessions")).toBeInTheDocument();
      expect(screen.getByText("2h 0m")).toBeInTheDocument();
      expect(screen.getByText("500 msgs")).toBeInTheDocument();
    });
  });

  describe("Unmerge functionality", () => {
    it("renders unmerge buttons when onUnmerge is provided", () => {
      const projects = [createMockProject()];
      render(<MergedProjectsCard mergedProjects={projects} onUnmerge={jest.fn()} />);
      expect(screen.getByRole("button", { name: /unmerge/i })).toBeInTheDocument();
    });

    it("does not render unmerge buttons when onUnmerge is not provided", () => {
      const projects = [createMockProject()];
      render(<MergedProjectsCard mergedProjects={projects} />);
      expect(screen.queryByRole("button", { name: /unmerge/i })).not.toBeInTheDocument();
    });

    it("calls onUnmerge with correct path when unmerge button is clicked", () => {
      const onUnmerge = jest.fn();
      const projects = [createMockProject({ path: "/test/path" })];
      render(<MergedProjectsCard mergedProjects={projects} onUnmerge={onUnmerge} />);

      fireEvent.click(screen.getByRole("button", { name: /unmerge/i }));

      expect(onUnmerge).toHaveBeenCalledTimes(1);
      expect(onUnmerge).toHaveBeenCalledWith("/test/path");
    });

    it("renders unmerge button for each project", () => {
      const onUnmerge = jest.fn();
      const projects = [
        createMockProject({ path: "/p1", name: "project-1" }),
        createMockProject({ path: "/p2", name: "project-2" }),
      ];
      render(<MergedProjectsCard mergedProjects={projects} onUnmerge={onUnmerge} />);

      const buttons = screen.getAllByRole("button", { name: /unmerge/i });
      expect(buttons).toHaveLength(2);
    });
  });

  describe("Styling", () => {
    it("renders with card styling", () => {
      const { container } = render(<MergedProjectsCard mergedProjects={[createMockProject()]} />);
      const card = container.firstChild;
      expect(card).toHaveClass("h-full");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("renders GitMerge icon in header", () => {
      const { container } = render(<MergedProjectsCard mergedProjects={[createMockProject()]} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
