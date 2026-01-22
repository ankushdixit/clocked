import { render, screen } from "@testing-library/react";
import { TopProjects } from "../TopProjects";
import type { ProjectSummary } from "@/types/electron";

const mockProjects: ProjectSummary[] = [
  {
    path: "/Users/test/raincheck",
    name: "raincheck",
    sessionCount: 53,
    totalTime: 1024440000,
    estimatedCost: 412.5,
  },
  {
    path: "/Users/test/solokit",
    name: "solokit",
    sessionCount: 25,
    totalTime: 252900000,
    estimatedCost: 156.2,
  },
  {
    path: "/Users/test/cosy",
    name: "cosy",
    sessionCount: 39,
    totalTime: 173400000,
    estimatedCost: 98.4,
  },
];

describe("TopProjects Component", () => {
  it("renders Top Projects title", () => {
    render(<TopProjects projects={mockProjects} />);
    expect(screen.getByText("Top Projects")).toBeInTheDocument();
  });

  it("renders project names", () => {
    render(<TopProjects projects={mockProjects} />);
    expect(screen.getByText("raincheck")).toBeInTheDocument();
    expect(screen.getByText("solokit")).toBeInTheDocument();
    expect(screen.getByText("cosy")).toBeInTheDocument();
  });

  it("renders session counts", () => {
    render(<TopProjects projects={mockProjects} />);
    expect(screen.getByText("53 sessions")).toBeInTheDocument();
    expect(screen.getByText("25 sessions")).toBeInTheDocument();
    expect(screen.getByText("39 sessions")).toBeInTheDocument();
  });

  it("renders singular 'session' for count of 1", () => {
    const singleSessionProject: ProjectSummary[] = [
      {
        path: "/Users/test/single",
        name: "single",
        sessionCount: 1,
        totalTime: 3600000,
        estimatedCost: 5.0,
      },
    ];
    render(<TopProjects projects={singleSessionProject} />);
    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("renders formatted time", () => {
    render(<TopProjects projects={mockProjects} />);
    // raincheck: 1024440000ms = 284h 34m
    expect(screen.getByText("284h 34m")).toBeInTheDocument();
    // solokit: 252900000ms = 70h 15m
    expect(screen.getByText("70h 15m")).toBeInTheDocument();
  });

  it("renders formatted cost", () => {
    render(<TopProjects projects={mockProjects} />);
    expect(screen.getByText("$412.50")).toBeInTheDocument();
    expect(screen.getByText("$156.20")).toBeInTheDocument();
  });

  it("renders links to project detail pages", () => {
    render(<TopProjects projects={mockProjects} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(3);
    expect(links[0]).toHaveAttribute("href", "/projects/%2FUsers%2Ftest%2Fraincheck");
    expect(links[1]).toHaveAttribute("href", "/projects/%2FUsers%2Ftest%2Fsolokit");
  });

  it("renders empty state when no projects", () => {
    render(<TopProjects projects={[]} />);
    expect(screen.getByText("No project activity this month")).toBeInTheDocument();
  });

  it("renders progress bars", () => {
    const { container } = render(<TopProjects projects={mockProjects} />);
    const progressBars = container.querySelectorAll(".bg-primary.rounded-full");
    expect(progressBars.length).toBe(3);
  });

  it("first project has 100% progress bar width", () => {
    const { container } = render(<TopProjects projects={mockProjects} />);
    const progressBars = container.querySelectorAll(".bg-primary.rounded-full");
    // First project has max time, so 100% width
    expect(progressBars[0]).toHaveStyle({ width: "100%" });
  });

  it("renders projects in correct order", () => {
    render(<TopProjects projects={mockProjects} />);
    const projectNames = screen
      .getAllByRole("link")
      .map((link) => link.querySelector(".font-medium")?.textContent);
    expect(projectNames).toEqual(["raincheck", "solokit", "cosy"]);
  });
});
