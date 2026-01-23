/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MergeDialog } from "../MergeDialog";
import type { Project } from "@/types/electron";

const mockProjects: Project[] = [
  {
    path: "/Users/test/project-alpha",
    name: "project-alpha",
    firstActivity: "2024-01-01T10:00:00Z",
    lastActivity: "2024-01-10T15:30:00Z",
    sessionCount: 5,
    messageCount: 100,
    totalTime: 3600000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
  {
    path: "/Users/test/project-beta",
    name: "project-beta",
    firstActivity: "2024-01-05T10:00:00Z",
    lastActivity: "2024-01-15T15:30:00Z",
    sessionCount: 10,
    messageCount: 200,
    totalTime: 7200000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
  {
    path: "/Users/test/project-gamma",
    name: "project-gamma",
    firstActivity: "2024-01-08T10:00:00Z",
    lastActivity: "2024-01-12T15:30:00Z",
    sessionCount: 3,
    messageCount: 50,
    totalTime: 1800000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
];

interface MergeDialogTestProps {
  open: boolean;
  onOpenChange: jest.Mock;
  selectedPaths: Set<string>;
  projects: Project[];
  selectedPrimary: string | null;
  onSelectPrimary: jest.Mock;
  onConfirm: jest.Mock;
}

const defaultProps: MergeDialogTestProps = {
  open: true,
  onOpenChange: jest.fn(),
  selectedPaths: new Set(["/Users/test/project-alpha", "/Users/test/project-beta"]),
  projects: mockProjects,
  selectedPrimary: null,
  onSelectPrimary: jest.fn(),
  onConfirm: jest.fn(),
};

const renderMergeDialog = (props: Partial<MergeDialogTestProps> = {}) => {
  return render(<MergeDialog {...defaultProps} {...props} />);
};

describe("MergeDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Dialog visibility", () => {
    it("does not render dialog content when open is false", () => {
      renderMergeDialog({ open: false });

      expect(screen.queryByText("Merge Projects")).not.toBeInTheDocument();
    });

    it("renders dialog with title when open is true", () => {
      renderMergeDialog({ open: true });

      expect(screen.getByText("Merge Projects")).toBeInTheDocument();
    });

    it("renders dialog description when open is true", () => {
      renderMergeDialog({ open: true });

      expect(screen.getByText(/Select which project should be the primary/)).toBeInTheDocument();
    });
  });

  describe("Project list display", () => {
    it("lists all selected projects with their names", () => {
      renderMergeDialog();

      expect(screen.getByText("project-alpha")).toBeInTheDocument();
      expect(screen.getByText("project-beta")).toBeInTheDocument();
    });

    it("displays project paths for each selected project", () => {
      renderMergeDialog();

      expect(screen.getByText("/Users/test/project-alpha")).toBeInTheDocument();
      expect(screen.getByText("/Users/test/project-beta")).toBeInTheDocument();
    });

    it("does not display projects that are not in selectedPaths", () => {
      renderMergeDialog();

      expect(screen.queryByText("project-gamma")).not.toBeInTheDocument();
    });

    it("handles missing project gracefully when path not found in projects array", () => {
      const selectedWithMissing = new Set([
        "/Users/test/project-alpha",
        "/Users/test/nonexistent-project",
      ]);

      renderMergeDialog({ selectedPaths: selectedWithMissing });

      expect(screen.getByText("project-alpha")).toBeInTheDocument();
      expect(screen.queryByText("nonexistent-project")).not.toBeInTheDocument();
    });
  });

  describe("Primary project selection", () => {
    it("renders radio buttons for project selection", () => {
      renderMergeDialog();

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons).toHaveLength(2);
    });

    it("shows no Primary label when no project is selected", () => {
      renderMergeDialog({ selectedPrimary: null });

      expect(screen.queryByText("Primary")).not.toBeInTheDocument();
    });

    it("shows Primary label for the selected primary project", () => {
      renderMergeDialog({ selectedPrimary: "/Users/test/project-alpha" });

      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("calls onSelectPrimary when clicking on a project", async () => {
      const user = userEvent.setup();
      const onSelectPrimary = jest.fn();
      renderMergeDialog({ onSelectPrimary });

      const projectLabel = screen.getByText("project-beta").closest("label");
      await user.click(projectLabel!);

      expect(onSelectPrimary).toHaveBeenCalledWith("/Users/test/project-beta");
    });

    it("calls onSelectPrimary when selecting a different project", async () => {
      const user = userEvent.setup();
      const onSelectPrimary = jest.fn();
      renderMergeDialog({
        selectedPrimary: "/Users/test/project-alpha",
        onSelectPrimary,
      });

      const projectLabel = screen.getByText("project-beta").closest("label");
      await user.click(projectLabel!);

      expect(onSelectPrimary).toHaveBeenCalledWith("/Users/test/project-beta");
    });

    it("checks the radio button for the selected primary project", () => {
      renderMergeDialog({ selectedPrimary: "/Users/test/project-alpha" });

      const radioButtons = screen.getAllByRole("radio");
      const alphaRadio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-alpha"
      );
      const betaRadio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-beta"
      );

      expect(alphaRadio).toBeChecked();
      expect(betaRadio).not.toBeChecked();
    });
  });

  describe("Merge button state", () => {
    it("disables Merge button when no primary is selected", () => {
      renderMergeDialog({ selectedPrimary: null });

      const mergeButton = screen.getByRole("button", { name: /merge/i });
      expect(mergeButton).toBeDisabled();
    });

    it("enables Merge button when a primary is selected", () => {
      renderMergeDialog({ selectedPrimary: "/Users/test/project-alpha" });

      const mergeButton = screen.getByRole("button", { name: /merge/i });
      expect(mergeButton).toBeEnabled();
    });
  });

  describe("Button actions", () => {
    it("calls onConfirm when clicking Merge button", async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      renderMergeDialog({
        selectedPrimary: "/Users/test/project-alpha",
        onConfirm,
      });

      const mergeButton = screen.getByRole("button", { name: /merge/i });
      await user.click(mergeButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenChange(false) when clicking Cancel button", async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      renderMergeDialog({ onOpenChange });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Visual styling", () => {
    it("applies highlighted styling to selected primary project", () => {
      renderMergeDialog({ selectedPrimary: "/Users/test/project-alpha" });

      const projectLabel = screen.getByText("project-alpha").closest("label");
      expect(projectLabel).toHaveClass("border-primary");
    });

    it("does not apply highlighted styling to non-primary projects", () => {
      renderMergeDialog({ selectedPrimary: "/Users/test/project-alpha" });

      const projectLabel = screen.getByText("project-beta").closest("label");
      expect(projectLabel).not.toHaveClass("border-primary");
    });
  });

  describe("Edge cases", () => {
    it("handles single project in selection", () => {
      const singleSelection = new Set(["/Users/test/project-alpha"]);
      renderMergeDialog({ selectedPaths: singleSelection });

      expect(screen.getByText("project-alpha")).toBeInTheDocument();
      expect(screen.queryByText("project-beta")).not.toBeInTheDocument();
    });

    it("handles three or more projects in selection", () => {
      const threeProjects = new Set([
        "/Users/test/project-alpha",
        "/Users/test/project-beta",
        "/Users/test/project-gamma",
      ]);
      renderMergeDialog({ selectedPaths: threeProjects });

      expect(screen.getByText("project-alpha")).toBeInTheDocument();
      expect(screen.getByText("project-beta")).toBeInTheDocument();
      expect(screen.getByText("project-gamma")).toBeInTheDocument();
    });

    it("handles empty selection gracefully", () => {
      const emptySelection = new Set<string>();
      renderMergeDialog({ selectedPaths: emptySelection });

      expect(screen.getByText("Merge Projects")).toBeInTheDocument();
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
    });
  });
});
