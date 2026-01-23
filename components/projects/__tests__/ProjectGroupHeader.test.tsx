/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectGroupHeader } from "../ProjectGroupHeader";
import type { ProjectGroup } from "@/types/electron";

const mockGroup: ProjectGroup = {
  id: "group-1",
  name: "Work Projects",
  color: "#3b82f6",
  createdAt: "2024-01-01T00:00:00Z",
  sortOrder: 0,
};

const mockGroupWithoutColor: ProjectGroup = {
  id: "group-2",
  name: "Personal Projects",
  color: null,
  createdAt: "2024-01-01T00:00:00Z",
  sortOrder: 1,
};

describe("ProjectGroupHeader", () => {
  describe("when group is provided", () => {
    it("renders group name", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      expect(screen.getByText("Work Projects")).toBeInTheDocument();
    });

    it("shows project count", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("shows group color indicator with specified color", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // The color indicator is a div with inline style
      const button = screen.getByRole("button");
      const colorIndicator = button.querySelector('[style*="background-color"]');
      expect(colorIndicator).toHaveStyle({ backgroundColor: "#3b82f6" });
    });

    it("shows default gray color when group color is null", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroupWithoutColor}
          projectCount={2}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const button = screen.getByRole("button");
      const colorIndicator = button.querySelector('[style*="background-color"]');
      expect(colorIndicator).toHaveStyle({ backgroundColor: "#6b7280" });
    });

    it("calls onToggleCollapse when clicking header", async () => {
      const user = userEvent.setup();
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const headerButton = screen.getByRole("button");
      await user.click(headerButton);

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it("shows chevron down when expanded", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // ChevronDown has class h-3.5 w-3.5 and should be in the document when expanded
      const button = screen.getByRole("button");
      // Lucide icons are rendered as SVG elements
      const chevronDown = button.querySelector("svg.lucide-chevron-down");
      expect(chevronDown).toBeInTheDocument();
    });

    it("shows chevron right when collapsed", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={true}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const button = screen.getByRole("button");
      const chevronRight = button.querySelector("svg.lucide-chevron-right");
      expect(chevronRight).toBeInTheDocument();
    });
  });

  describe("when group is null (ungrouped section)", () => {
    it('renders "Ungrouped" text', () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={null}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      expect(screen.getByText("Ungrouped")).toBeInTheDocument();
    });

    it("shows project count", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={null}
          projectCount={7}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("shows folder icon instead of color indicator", () => {
      const onToggleCollapse = jest.fn();

      const { container } = render(
        <ProjectGroupHeader
          group={null}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // FolderOpen icon should be present
      const folderIcon = container.querySelector("svg.lucide-folder-open");
      expect(folderIcon).toBeInTheDocument();
    });

    it("is not clickable/collapsible (renders as div, not button)", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={null}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // Should not render a button element for ungrouped section
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("does not call onToggleCollapse when clicked", async () => {
      const user = userEvent.setup();
      const onToggleCollapse = jest.fn();

      const { container } = render(
        <ProjectGroupHeader
          group={null}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // Click on the container div
      const headerDiv = container.firstChild as HTMLElement;
      await user.click(headerDiv);

      expect(onToggleCollapse).not.toHaveBeenCalled();
    });

    it("does not show chevron icons", () => {
      const onToggleCollapse = jest.fn();

      const { container } = render(
        <ProjectGroupHeader
          group={null}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const chevronDown = container.querySelector("svg.lucide-chevron-down");
      const chevronRight = container.querySelector("svg.lucide-chevron-right");

      expect(chevronDown).not.toBeInTheDocument();
      expect(chevronRight).not.toBeInTheDocument();
    });
  });
});
