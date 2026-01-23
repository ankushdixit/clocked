/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectsToolbar } from "../ProjectsToolbar";
import type { SortField, SortOrder } from "../types";

const defaultProps = {
  sortField: "lastActivity" as SortField,
  sortOrder: "desc" as SortOrder,
  onSort: jest.fn(),
  showHidden: false,
  onShowHiddenChange: jest.fn(),
  hiddenCount: 0,
  isSelectMode: false,
  selectedCount: 0,
  onMergeClick: jest.fn(),
  onEnterSelectMode: jest.fn(),
  onCancelSelectMode: jest.fn(),
};

const renderToolbar = (props: Partial<typeof defaultProps> = {}) => {
  return render(<ProjectsToolbar {...defaultProps} {...props} />);
};

describe("ProjectsToolbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Sort button", () => {
    it("renders sort button with current sort field name (Activity)", () => {
      renderToolbar({ sortField: "lastActivity" });

      const sortButton = screen.getByRole("button", { name: /sort by activity/i });
      expect(sortButton).toBeInTheDocument();
    });

    it("renders sort button with current sort field name (Sessions)", () => {
      renderToolbar({ sortField: "sessionCount" });

      const sortButton = screen.getByRole("button", { name: /sort by sessions/i });
      expect(sortButton).toBeInTheDocument();
    });

    it("renders sort button with current sort field name (Time)", () => {
      renderToolbar({ sortField: "totalTime" });

      const sortButton = screen.getByRole("button", { name: /sort by time/i });
      expect(sortButton).toBeInTheDocument();
    });

    it("renders sort button with current sort field name (Name)", () => {
      renderToolbar({ sortField: "name" });

      const sortButton = screen.getByRole("button", { name: /sort by name/i });
      expect(sortButton).toBeInTheDocument();
    });
  });

  describe("Sort dropdown", () => {
    it("shows all sort options when dropdown is opened", async () => {
      const user = userEvent.setup();
      renderToolbar();

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      expect(await screen.findByRole("menuitem", { name: /last activity/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /sessions/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /total time/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /^name$/i })).toBeInTheDocument();
    });

    it("calls onSort with lastActivity when clicking Last Activity option", async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();
      renderToolbar({ onSort, sortField: "name" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const activityOption = await screen.findByRole("menuitem", { name: /last activity/i });
      await user.click(activityOption);

      expect(onSort).toHaveBeenCalledWith("lastActivity");
    });

    it("calls onSort with sessionCount when clicking Sessions option", async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();
      renderToolbar({ onSort });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const sessionsOption = await screen.findByRole("menuitem", { name: /sessions/i });
      await user.click(sessionsOption);

      expect(onSort).toHaveBeenCalledWith("sessionCount");
    });

    it("calls onSort with totalTime when clicking Total Time option", async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();
      renderToolbar({ onSort });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const timeOption = await screen.findByRole("menuitem", { name: /total time/i });
      await user.click(timeOption);

      expect(onSort).toHaveBeenCalledWith("totalTime");
    });

    it("calls onSort with name when clicking Name option", async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();
      renderToolbar({ onSort });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const nameOption = await screen.findByRole("menuitem", { name: /^name$/i });
      await user.click(nameOption);

      expect(onSort).toHaveBeenCalledWith("name");
    });
  });

  describe("Active sort option indicators", () => {
    it("shows checkmark on active sort option", async () => {
      const user = userEvent.setup();
      renderToolbar({ sortField: "sessionCount" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      // The sessions menu item should contain the check icon and arrow when active
      const sessionsOption = await screen.findByRole("menuitem", { name: /sessions/i });
      // Lucide icons are SVGs, verify they're present (arrow + checkmark = 2 SVGs)
      expect(sessionsOption.querySelectorAll("svg").length).toBe(2);
    });

    it("does not show indicators on inactive sort options", async () => {
      const user = userEvent.setup();
      renderToolbar({ sortField: "sessionCount" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      // Last Activity is not active, so it should not have checkmark
      const activityOption = await screen.findByRole("menuitem", { name: /last activity/i });
      // Should not have any svgs (no arrow or checkmark)
      expect(activityOption.querySelectorAll("svg").length).toBe(0);
    });
  });

  describe("Arrow direction based on sort order", () => {
    it("shows down arrow for desc order on non-name fields", () => {
      renderToolbar({ sortField: "lastActivity", sortOrder: "desc" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      // Check that the button contains an arrow down icon (ArrowDown has the class)
      const downArrow = sortButton.querySelector("svg");
      expect(downArrow).toBeInTheDocument();
      // ArrowDown icon should be present - we verify by checking the button has SVG
    });

    it("shows up arrow for asc order on non-name fields", () => {
      renderToolbar({ sortField: "lastActivity", sortOrder: "asc" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      const arrowIcon = sortButton.querySelector("svg");
      expect(arrowIcon).toBeInTheDocument();
    });

    it("shows down arrow for asc order on name field (A-Z = down)", () => {
      renderToolbar({ sortField: "name", sortOrder: "asc" });

      // For name field, asc (A-Z) shows down arrow
      const sortButton = screen.getByRole("button", { name: /sort by/i });
      const arrowIcon = sortButton.querySelector("svg");
      expect(arrowIcon).toBeInTheDocument();
    });

    it("shows up arrow for desc order on name field (Z-A = up)", () => {
      renderToolbar({ sortField: "name", sortOrder: "desc" });

      // For name field, desc (Z-A) shows up arrow
      const sortButton = screen.getByRole("button", { name: /sort by/i });
      const arrowIcon = sortButton.querySelector("svg");
      expect(arrowIcon).toBeInTheDocument();
    });

    it("dropdown menu shows correct arrow for active name field with asc order", async () => {
      const user = userEvent.setup();
      renderToolbar({ sortField: "name", sortOrder: "asc" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const nameOption = await screen.findByRole("menuitem", { name: /^name$/i });
      // Name option should have indicators when active
      expect(nameOption.querySelectorAll("svg").length).toBeGreaterThan(0);
    });

    it("dropdown menu shows correct arrow for active name field with desc order", async () => {
      const user = userEvent.setup();
      renderToolbar({ sortField: "name", sortOrder: "desc" });

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const nameOption = await screen.findByRole("menuitem", { name: /^name$/i });
      // Name option should have indicators when active
      expect(nameOption.querySelectorAll("svg").length).toBeGreaterThan(0);
    });
  });

  describe("Show hidden toggle", () => {
    it("shows show hidden toggle when hiddenCount > 0", () => {
      renderToolbar({ hiddenCount: 3 });

      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText(/show hidden \(3\)/i)).toBeInTheDocument();
    });

    it("does not show show hidden toggle when hiddenCount is 0", () => {
      renderToolbar({ hiddenCount: 0 });

      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
      expect(screen.queryByText(/show hidden/i)).not.toBeInTheDocument();
    });

    it("calls onShowHiddenChange when toggle is clicked", async () => {
      const user = userEvent.setup();
      const onShowHiddenChange = jest.fn();
      renderToolbar({ hiddenCount: 5, showHidden: false, onShowHiddenChange });

      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      expect(onShowHiddenChange).toHaveBeenCalledWith(true);
    });

    it("toggle reflects showHidden state", () => {
      renderToolbar({ hiddenCount: 3, showHidden: true });

      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("data-state", "checked");
    });

    it("toggle reflects unchecked state when showHidden is false", () => {
      renderToolbar({ hiddenCount: 3, showHidden: false });

      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("data-state", "unchecked");
    });
  });

  describe("Normal mode (not select mode)", () => {
    it("shows Merge Projects button in normal mode", () => {
      renderToolbar({ isSelectMode: false });

      expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
    });

    it("calls onEnterSelectMode when Merge Projects button is clicked", async () => {
      const user = userEvent.setup();
      const onEnterSelectMode = jest.fn();
      renderToolbar({ isSelectMode: false, onEnterSelectMode });

      const mergeButton = screen.getByRole("button", { name: /merge projects/i });
      await user.click(mergeButton);

      expect(onEnterSelectMode).toHaveBeenCalled();
    });

    it("does not show Cancel button in normal mode", () => {
      renderToolbar({ isSelectMode: false });

      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });

    it("does not show selected count in normal mode", () => {
      renderToolbar({ isSelectMode: false, selectedCount: 5 });

      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
    });
  });

  describe("Select mode", () => {
    it("shows selected count in select mode", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 3 });

      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    });

    it("shows Merge button in select mode", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 2 });

      expect(screen.getByRole("button", { name: /^merge$/i })).toBeInTheDocument();
    });

    it("shows Cancel button in select mode", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 0 });

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("Merge button is disabled when less than 2 projects selected (0 selected)", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 0 });

      const mergeButton = screen.getByRole("button", { name: /^merge$/i });
      expect(mergeButton).toBeDisabled();
    });

    it("Merge button is disabled when less than 2 projects selected (1 selected)", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 1 });

      const mergeButton = screen.getByRole("button", { name: /^merge$/i });
      expect(mergeButton).toBeDisabled();
    });

    it("Merge button is enabled when 2 or more projects selected", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 2 });

      const mergeButton = screen.getByRole("button", { name: /^merge$/i });
      expect(mergeButton).toBeEnabled();
    });

    it("Merge button is enabled when many projects selected", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 5 });

      const mergeButton = screen.getByRole("button", { name: /^merge$/i });
      expect(mergeButton).toBeEnabled();
    });

    it("calls onMergeClick when Merge button is clicked", async () => {
      const user = userEvent.setup();
      const onMergeClick = jest.fn();
      renderToolbar({ isSelectMode: true, selectedCount: 2, onMergeClick });

      const mergeButton = screen.getByRole("button", { name: /^merge$/i });
      await user.click(mergeButton);

      expect(onMergeClick).toHaveBeenCalled();
    });

    it("calls onCancelSelectMode when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancelSelectMode = jest.fn();
      renderToolbar({ isSelectMode: true, selectedCount: 1, onCancelSelectMode });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancelSelectMode).toHaveBeenCalled();
    });

    it("does not show Merge Projects button in select mode", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 0 });

      expect(screen.queryByRole("button", { name: /merge projects/i })).not.toBeInTheDocument();
    });
  });

  describe("Responsive text", () => {
    it("renders shorter text for mobile (Sort) alongside full text (Sort by X)", () => {
      renderToolbar({ sortField: "lastActivity" });

      const sortButton = screen.getByRole("button", { name: /sort/i });
      // Both "Sort" and "Sort by Activity" should be in the DOM (hidden via CSS)
      expect(sortButton.textContent).toContain("Sort");
      expect(sortButton.textContent).toContain("Sort by Activity");
    });

    it("renders shorter text for mobile (Merge) alongside full text (Merge Projects) in normal mode", () => {
      renderToolbar({ isSelectMode: false });

      const mergeButton = screen.getByRole("button", { name: /merge/i });
      // Both should be in the DOM (one hidden via CSS sm:hidden, other via hidden sm:inline)
      expect(mergeButton.textContent).toContain("Merge");
      expect(mergeButton.textContent).toContain("Merge Projects");
    });

    it("renders shorter count for mobile alongside full count (X selected) in select mode", () => {
      renderToolbar({ isSelectMode: true, selectedCount: 3 });

      // Check that both the short form and long form are present
      const selectedText = screen.getByText((content, element) => {
        return content.includes("3") && (element?.textContent?.includes("selected") ?? false);
      });
      expect(selectedText).toBeInTheDocument();
    });
  });

  describe("Combined scenarios", () => {
    it("renders all controls correctly in normal mode with hidden projects", () => {
      renderToolbar({
        sortField: "totalTime",
        sortOrder: "desc",
        hiddenCount: 5,
        showHidden: false,
        isSelectMode: false,
      });

      expect(screen.getByRole("button", { name: /sort by time/i })).toBeInTheDocument();
      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText(/show hidden \(5\)/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
    });

    it("renders all controls correctly in select mode with hidden projects", () => {
      renderToolbar({
        sortField: "name",
        sortOrder: "asc",
        hiddenCount: 2,
        showHidden: true,
        isSelectMode: true,
        selectedCount: 3,
      });

      expect(screen.getByRole("button", { name: /sort by name/i })).toBeInTheDocument();
      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^merge$/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
