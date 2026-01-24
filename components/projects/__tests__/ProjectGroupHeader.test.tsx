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

      const { container } = render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // The color indicator is a div with inline style inside the collapse button
      const colorIndicator = container.querySelector(
        '[style*="background-color: rgb(59, 130, 246)"]'
      );
      expect(colorIndicator).toBeInTheDocument();
    });

    it("shows default gray color when group color is null", () => {
      const onToggleCollapse = jest.fn();

      const { container } = render(
        <ProjectGroupHeader
          group={mockGroupWithoutColor}
          projectCount={2}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const colorIndicator = container.querySelector(
        '[style*="background-color: rgb(107, 114, 128)"]'
      );
      expect(colorIndicator).toBeInTheDocument();
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

      // Click on the collapse button (contains the group name)
      const collapseButton = screen.getByText("Work Projects").closest("button");
      await user.click(collapseButton!);

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

      // ChevronDown should be in the collapse button when expanded
      const collapseButton = screen.getByText("Work Projects").closest("button");
      const chevronDown = collapseButton?.querySelector("svg.lucide-chevron-down");
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

      const collapseButton = screen.getByText("Work Projects").closest("button");
      const chevronRight = collapseButton?.querySelector("svg.lucide-chevron-right");
      expect(chevronRight).toBeInTheDocument();
    });

    it("renders move up and move down buttons", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
          canMoveUp={true}
          canMoveDown={true}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /move group up/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /move group down/i })).toBeInTheDocument();
    });

    it("disables move up button when canMoveUp is false", () => {
      const onToggleCollapse = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
          canMoveUp={false}
          canMoveDown={true}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /move group up/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /move group down/i })).toBeEnabled();
    });

    it("calls onMoveUp when move up button is clicked", async () => {
      const user = userEvent.setup();
      const onToggleCollapse = jest.fn();
      const onMoveUp = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
          canMoveUp={true}
          canMoveDown={true}
          onMoveUp={onMoveUp}
          onMoveDown={jest.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /move group up/i }));
      expect(onMoveUp).toHaveBeenCalledTimes(1);
      expect(onToggleCollapse).not.toHaveBeenCalled();
    });

    it("calls onMoveDown when move down button is clicked", async () => {
      const user = userEvent.setup();
      const onToggleCollapse = jest.fn();
      const onMoveDown = jest.fn();

      render(
        <ProjectGroupHeader
          group={mockGroup}
          projectCount={5}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
          canMoveUp={true}
          canMoveDown={true}
          onMoveUp={jest.fn()}
          onMoveDown={onMoveDown}
        />
      );

      await user.click(screen.getByRole("button", { name: /move group down/i }));
      expect(onMoveDown).toHaveBeenCalledTimes(1);
      expect(onToggleCollapse).not.toHaveBeenCalled();
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

      // Should not render any button elements for ungrouped section (no collapse, no reorder)
      expect(screen.queryAllByRole("button")).toHaveLength(0);
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

    it("does not show chevron icons for collapse or reorder", () => {
      const onToggleCollapse = jest.fn();

      const { container } = render(
        <ProjectGroupHeader
          group={null}
          projectCount={3}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // No collapse chevrons
      const chevronDown = container.querySelector("svg.lucide-chevron-down");
      const chevronRight = container.querySelector("svg.lucide-chevron-right");
      const chevronUp = container.querySelector("svg.lucide-chevron-up");

      expect(chevronDown).not.toBeInTheDocument();
      expect(chevronRight).not.toBeInTheDocument();
      expect(chevronUp).not.toBeInTheDocument();
    });
  });
});
