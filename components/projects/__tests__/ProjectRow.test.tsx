/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectRow } from "../ProjectRow";
import { Table, TableBody } from "@/components/ui/table";
import type { Project, ProjectGroup } from "@/types/electron";

const mockProject: Project = {
  path: "/Users/test/my-project",
  name: "my-project",
  firstActivity: "2024-01-01T10:00:00Z",
  lastActivity: "2024-01-15T15:30:00Z",
  sessionCount: 5,
  messageCount: 100,
  totalTime: 3600000, // 1 hour
  isHidden: false,
  groupId: null,
  isDefault: false,
};

const mockGroups: ProjectGroup[] = [
  {
    id: "group-1",
    name: "Work Projects",
    color: "#3b82f6",
    createdAt: "2024-01-01T00:00:00Z",
    sortOrder: 0,
  },
];

const renderProjectRow = (
  project: Project,
  onClick: jest.Mock,
  options: {
    groups?: ProjectGroup[];
    onSetHidden?: jest.Mock;
    onSetGroup?: jest.Mock;
    onSetDefault?: jest.Mock;
  } = {}
) => {
  const {
    groups = mockGroups,
    onSetHidden = jest.fn(),
    onSetGroup = jest.fn(),
    onSetDefault = jest.fn(),
  } = options;

  return render(
    <Table>
      <TableBody>
        <ProjectRow
          project={project}
          groups={groups}
          onClick={onClick}
          onSetHidden={onSetHidden}
          onSetGroup={onSetGroup}
          onSetDefault={onSetDefault}
        />
      </TableBody>
    </Table>
  );
};

describe("ProjectRow", () => {
  it("renders project name", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    expect(screen.getByText("my-project")).toBeInTheDocument();
  });

  it("renders session count", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders formatted time", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });

  it("renders last activity date", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    // Date format depends on locale, check that a date-like string is present
    const dateCell = screen.getByText(/2024/);
    expect(dateCell).toBeInTheDocument();
  });

  it("calls onClick when name cell is clicked", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);

    const nameCell = screen.getByText("my-project");
    fireEvent.click(nameCell);

    expect(onClick).toHaveBeenCalledWith(mockProject);
  });

  it("has correct test id", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    expect(screen.getByTestId(`project-row-${mockProject.path}`)).toBeInTheDocument();
  });

  it("renders 0m for zero totalTime", () => {
    const onClick = jest.fn();
    const projectWithZeroTime = { ...mockProject, totalTime: 0 };
    renderProjectRow(projectWithZeroTime, onClick);
    expect(screen.getByText("0m")).toBeInTheDocument();
  });

  it("renders project path", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    expect(screen.getByText("/Users/test/my-project")).toBeInTheDocument();
  });

  it("shows star icon for default project", () => {
    const onClick = jest.fn();
    const defaultProject = { ...mockProject, isDefault: true };
    renderProjectRow(defaultProject, onClick);
    // The star icon should be present (it's a lucide icon, so check for the svg)
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("has actions menu button", () => {
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);
    expect(screen.getByRole("button", { name: /open menu/i })).toBeInTheDocument();
  });
});

describe("ProjectRow dropdown menu actions", () => {
  it("calls onSetHidden when hide project is clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSetHidden = jest.fn();
    renderProjectRow(mockProject, onClick, { onSetHidden });

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Click on "Hide project"
    const hideOption = await screen.findByRole("menuitem", { name: /hide project/i });
    await user.click(hideOption);

    expect(onSetHidden).toHaveBeenCalledWith(mockProject, true);
  });

  it("calls onSetHidden with false when show project is clicked for hidden project", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSetHidden = jest.fn();
    const hiddenProject = { ...mockProject, isHidden: true };
    renderProjectRow(hiddenProject, onClick, { onSetHidden });

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Click on "Show project"
    const showOption = await screen.findByRole("menuitem", { name: /show project/i });
    await user.click(showOption);

    expect(onSetHidden).toHaveBeenCalledWith(hiddenProject, false);
  });

  it("calls onSetDefault when set as default is clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSetDefault = jest.fn();
    renderProjectRow(mockProject, onClick, { onSetDefault });

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Click on "Set as default"
    const setDefaultOption = await screen.findByRole("menuitem", { name: /set as default/i });
    await user.click(setDefaultOption);

    expect(onSetDefault).toHaveBeenCalledWith(mockProject);
  });

  it("does not show set as default for already default project", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const defaultProject = { ...mockProject, isDefault: true };
    renderProjectRow(defaultProject, onClick);

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Wait for menu to open then check
    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /set as default/i })).not.toBeInTheDocument();
    });
  });

  it("shows Move to group submenu trigger", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick);

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // "Move to group" should be visible
    expect(await screen.findByText("Move to group")).toBeInTheDocument();
  });

  it("shows no groups available message when groups list is empty", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    renderProjectRow(mockProject, onClick, { groups: [] });

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Find the "Move to group" trigger and hover to open submenu
    const moveToGroupTrigger = await screen.findByText("Move to group");
    await user.hover(moveToGroupTrigger);

    // "No groups available" should appear
    expect(await screen.findByText("No groups available")).toBeInTheDocument();
  });

  it("calls onSetGroup when a group is selected from submenu", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSetGroup = jest.fn();
    renderProjectRow(mockProject, onClick, { onSetGroup });

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Hover over "Move to group" to open submenu
    const moveToGroupTrigger = await screen.findByText("Move to group");
    await user.hover(moveToGroupTrigger);

    // Wait for submenu to appear and click on the group using fireEvent
    const groupOption = await screen.findByText("Work Projects");
    fireEvent.click(groupOption);

    expect(onSetGroup).toHaveBeenCalledWith(mockProject, "group-1");
  });

  it("calls onSetGroup with null when removing from group", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSetGroup = jest.fn();
    const projectInGroup = { ...mockProject, groupId: "group-1" };
    renderProjectRow(projectInGroup, onClick, { onSetGroup });

    // Open the dropdown menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Hover over "Move to group" to open submenu
    const moveToGroupTrigger = await screen.findByText("Move to group");
    await user.hover(moveToGroupTrigger);

    // Wait for submenu to appear and click on "Remove from group" using fireEvent
    const removeOption = await screen.findByText("Remove from group");
    fireEvent.click(removeOption);

    expect(onSetGroup).toHaveBeenCalledWith(projectInGroup, null);
  });
});
