import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../dropdown-menu";
import { Button } from "../button";
import { useState } from "react";

// Test component for radio group functionality
function RadioGroupDropdown({
  defaultValue = "light",
  onValueChange,
}: {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Select Theme</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={handleChange}>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenuRadioItem", () => {
  it("renders radio items in a radio group", async () => {
    const user = userEvent.setup();
    render(<RadioGroupDropdown />);

    // Open the dropdown
    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    // Verify all radio items are rendered
    expect(screen.getByRole("menuitemradio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "System" })).toBeInTheDocument();
  });

  it("shows the default selected value as checked", async () => {
    const user = userEvent.setup();
    render(<RadioGroupDropdown defaultValue="dark" />);

    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    const darkOption = screen.getByRole("menuitemradio", { name: "Dark" });
    const lightOption = screen.getByRole("menuitemradio", { name: "Light" });

    expect(darkOption).toBeChecked();
    expect(lightOption).not.toBeChecked();
  });

  it("changes selection when clicking a different radio item", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<RadioGroupDropdown defaultValue="light" onValueChange={handleChange} />);

    // Open dropdown
    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    // Click on Dark option
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

    expect(handleChange).toHaveBeenCalledWith("dark");
  });

  it("updates checked state after selection", async () => {
    const user = userEvent.setup();
    render(<RadioGroupDropdown defaultValue="light" />);

    // Open dropdown and select dark
    await user.click(screen.getByRole("button", { name: "Select Theme" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

    // Re-open dropdown to verify state change
    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    const darkOption = screen.getByRole("menuitemradio", { name: "Dark" });
    const lightOption = screen.getByRole("menuitemradio", { name: "Light" });

    expect(darkOption).toBeChecked();
    expect(lightOption).not.toBeChecked();
  });

  it("applies custom className to radio items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="test">
            <DropdownMenuRadioItem value="test" className="custom-radio-class">
              Test Option
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const radioItem = screen.getByRole("menuitemradio", { name: "Test Option" });
    expect(radioItem).toHaveClass("custom-radio-class");
  });

  it("shows indicator icon for checked item", async () => {
    const user = userEvent.setup();
    render(<RadioGroupDropdown defaultValue="light" />);

    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    // The checked item should have the circle indicator visible
    const lightOption = screen.getByRole("menuitemradio", { name: "Light" });
    const indicatorSpan = lightOption.querySelector("span");
    expect(indicatorSpan).toBeInTheDocument();
  });

  it("allows keyboard navigation between radio items", async () => {
    const user = userEvent.setup();
    render(<RadioGroupDropdown defaultValue="light" />);

    // Open dropdown
    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    // Navigate with arrow keys
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");

    // The focus should move between items
    // Verify dropdown content is visible
    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toBeInTheDocument();
  });

  it("closes dropdown after selecting a radio item", async () => {
    const user = userEvent.setup();
    render(<RadioGroupDropdown defaultValue="light" />);

    // Open dropdown
    await user.click(screen.getByRole("button", { name: "Select Theme" }));

    // Verify dropdown is open
    expect(screen.getByRole("menuitemradio", { name: "Light" })).toBeVisible();

    // Select an option
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

    // Dropdown should close
    expect(screen.queryByRole("menuitemradio", { name: "Light" })).not.toBeInTheDocument();
  });

  it("supports disabled radio items", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1" onValueChange={handleChange}>
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2" disabled>
              Option 2 (Disabled)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const disabledOption = screen.getByRole("menuitemradio", { name: "Option 2 (Disabled)" });
    expect(disabledOption).toHaveAttribute("data-disabled", "");

    // Try to click disabled item - should not trigger change
    await user.click(disabledOption);
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe("DropdownMenuShortcut", () => {
  it("renders shortcut text", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut>Cmd+S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByText("Cmd+S")).toBeInTheDocument();
  });

  it("applies custom className", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Undo
            <DropdownMenuShortcut className="custom-shortcut">Cmd+Z</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    const shortcut = screen.getByText("Cmd+Z");
    expect(shortcut).toHaveClass("custom-shortcut");
  });

  it("renders multiple shortcuts in different menu items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Edit</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Cut
            <DropdownMenuShortcut>Cmd+X</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Copy
            <DropdownMenuShortcut>Cmd+C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Paste
            <DropdownMenuShortcut>Cmd+V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByText("Cmd+X")).toBeInTheDocument();
    expect(screen.getByText("Cmd+C")).toBeInTheDocument();
    expect(screen.getByText("Cmd+V")).toBeInTheDocument();
  });

  it("has correct display name", () => {
    expect(DropdownMenuShortcut.displayName).toBe("DropdownMenuShortcut");
  });

  it("passes through additional HTML attributes", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Delete
            <DropdownMenuShortcut data-testid="delete-shortcut" aria-label="Delete shortcut">
              Del
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    const shortcut = screen.getByTestId("delete-shortcut");
    expect(shortcut).toBeInTheDocument();
    expect(shortcut).toHaveAttribute("aria-label", "Delete shortcut");
    expect(shortcut).toHaveTextContent("Del");
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("renders checkbox items with checked state", async () => {
    const user = userEvent.setup();
    const [checked, setChecked] = [true, jest.fn()];

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Settings</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
            Show Status Bar
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Settings" }));

    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Show Status Bar" });
    expect(checkbox).toBeChecked();
  });

  it("toggles checkbox state on click", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    function TestComponent() {
      const [checked, setChecked] = useState(false);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Settings</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={checked}
              onCheckedChange={(value) => {
                setChecked(value);
                handleChange(value);
              }}
            >
              Enable Feature
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    render(<TestComponent />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Enable Feature" }));

    expect(handleChange).toHaveBeenCalledWith(true);
  });
});

describe("DropdownMenu Integration", () => {
  it("renders a complete dropdown with all component types", async () => {
    const user = userEvent.setup();
    const [radioValue, setRadioValue] = ["small", jest.fn()];
    const [checkboxChecked, setCheckboxChecked] = [true, jest.fn()];

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Text Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={radioValue} onValueChange={setRadioValue}>
            <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={checkboxChecked} onCheckedChange={setCheckboxChecked}>
            Bold Text
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Apply
            <DropdownMenuShortcut>Enter</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Options" }));

    // Verify label
    expect(screen.getByText("Text Settings")).toBeInTheDocument();

    // Verify radio items
    expect(screen.getByRole("menuitemradio", { name: "Small" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Medium" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Large" })).toBeInTheDocument();

    // Verify checkbox
    expect(screen.getByRole("menuitemcheckbox", { name: "Bold Text" })).toBeInTheDocument();

    // Verify menu item with shortcut
    expect(screen.getByRole("menuitem", { name: /Apply/ })).toBeInTheDocument();
    expect(screen.getByText("Enter")).toBeInTheDocument();
  });

  it("handles a real-world font size selection scenario", async () => {
    const user = userEvent.setup();
    const handleFontSizeChange = jest.fn();

    function FontSizeSelector() {
      const [fontSize, setFontSize] = useState("medium");

      const handleChange = (value: string) => {
        setFontSize(value);
        handleFontSizeChange(value);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Font Size: {fontSize}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Select Font Size</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={fontSize} onValueChange={handleChange}>
              <DropdownMenuRadioItem value="small">Small (12px)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium (16px)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Large (20px)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="xlarge">Extra Large (24px)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    render(<FontSizeSelector />);

    // Initial state shows medium
    expect(screen.getByRole("button", { name: "Font Size: medium" })).toBeInTheDocument();

    // Open dropdown and select large
    await user.click(screen.getByRole("button", { name: "Font Size: medium" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Large (20px)" }));

    // Verify callback was called
    expect(handleFontSizeChange).toHaveBeenCalledWith("large");

    // Button text should update
    expect(screen.getByRole("button", { name: "Font Size: large" })).toBeInTheDocument();

    // Open again to verify selection persisted
    await user.click(screen.getByRole("button", { name: "Font Size: large" }));
    expect(screen.getByRole("menuitemradio", { name: "Large (20px)" })).toBeChecked();
    expect(screen.getByRole("menuitemradio", { name: "Medium (16px)" })).not.toBeChecked();
  });
});

describe("DropdownMenuItem with inset", () => {
  it("applies inset styling when inset prop is true", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          <DropdownMenuItem>Normal Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    const insetItem = screen.getByRole("menuitem", { name: "Inset Item" });
    const normalItem = screen.getByRole("menuitem", { name: "Normal Item" });

    // Inset item should have pl-8 class
    expect(insetItem).toHaveClass("pl-8");
    expect(normalItem).not.toHaveClass("pl-8");
  });

  it("works without inset prop (default behavior)", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Default Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    const item = screen.getByRole("menuitem", { name: "Default Item" });
    expect(item).not.toHaveClass("pl-8");
  });
});

describe("DropdownMenuLabel with inset", () => {
  it("applies inset styling when inset prop is true", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          <DropdownMenuLabel>Normal Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    const insetLabel = screen.getByText("Inset Label");
    const normalLabel = screen.getByText("Normal Label");

    expect(insetLabel).toHaveClass("pl-8");
    expect(normalLabel).not.toHaveClass("pl-8");
  });
});

describe("DropdownMenuSubTrigger with inset", () => {
  it("applies inset styling when inset prop is true", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Inset Submenu</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Normal Submenu</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    const insetSubTrigger = screen.getByText("Inset Submenu");
    const normalSubTrigger = screen.getByText("Normal Submenu");

    expect(insetSubTrigger).toHaveClass("pl-8");
    expect(normalSubTrigger).not.toHaveClass("pl-8");
  });

  it("shows chevron icon indicating submenu", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Option A</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    // The submenu trigger should be visible
    expect(screen.getByText("More Options")).toBeInTheDocument();

    // ChevronRight icon should be present (rendered as SVG)
    const subTrigger = screen.getByText("More Options").closest("[role='menuitem']");
    expect(subTrigger).toBeInTheDocument();
    const svg = subTrigger?.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});

describe("DropdownMenuSubContent", () => {
  it("renders submenu content when submenu is opened", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Twitter</DropdownMenuItem>
              <DropdownMenuItem>Facebook</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    // Open main dropdown
    await user.click(screen.getByRole("button", { name: "Menu" }));

    // Initially submenu items should not be visible
    expect(screen.queryByText("Email")).not.toBeInTheDocument();

    // Hover over submenu trigger to open it
    await user.hover(screen.getByText("Share"));

    // Wait for submenu to appear
    const emailItem = await screen.findByText("Email");
    expect(emailItem).toBeInTheDocument();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
  });

  it("applies custom className to submenu content", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="custom-subcontent">
              <DropdownMenuItem>Sub Option</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.hover(screen.getByText("Options"));

    // Wait for submenu and check class
    const subOption = await screen.findByText("Sub Option");
    const subContent = subOption.closest("[role='menu']");
    expect(subContent).toHaveClass("custom-subcontent");
  });
});

describe("DropdownMenuSeparator", () => {
  it("renders separator between menu items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator data-testid="separator" />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    const separator = screen.getByTestId("separator");
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("role", "separator");
  });

  it("applies custom className to separator", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator className="custom-separator" data-testid="sep" />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    expect(screen.getByTestId("sep")).toHaveClass("custom-separator");
  });
});

describe("DropdownMenuContent", () => {
  it("applies custom className", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    const content = screen.getByRole("menu");
    expect(content).toHaveClass("custom-content");
  });

  it("supports custom sideOffset", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={10}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    // Verify content renders (sideOffset is visual, hard to test directly)
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
