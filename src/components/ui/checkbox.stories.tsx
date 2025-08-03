import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { useState } from "react";
import { css } from "styled-system/css";
import { stack, flex } from "styled-system/patterns";
import { CheckedChangeDetails } from "node_modules/@ark-ui/react/dist/components/checkbox/checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Core Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "The size of the checkbox",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the checkbox is disabled",
    },
    defaultChecked: {
      control: { type: "boolean" },
      description: "Whether the checkbox is checked by default",
    },
    checked: {
      control: { type: "select" },
      options: [false, true, "indeterminate"],
      description:
        'The checked state of the checkbox (false, true, or "indeterminate")',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Checkbox
export const Default: Story = {
  args: {
    children: "Accept terms and conditions",
  },
};

// Checked State
export const Checked: Story = {
  args: {
    children: "I agree to the terms and conditions",
    defaultChecked: true,
  },
};

// Unchecked State
export const Unchecked: Story = {
  args: {
    children: "I agree to the terms and conditions",
    defaultChecked: false,
  },
};

// Indeterminate State
export const Indeterminate: Story = {
  args: {
    children: "Select all notifications",
    checked: "indeterminate",
  },
};

// Disabled States
export const Disabled: Story = {
  render: () => (
    <div className={stack({ gap: "4" })}>
      <Checkbox disabled>Disabled unchecked checkbox</Checkbox>
      <Checkbox disabled defaultChecked>
        Disabled checked checkbox
      </Checkbox>
      <Checkbox disabled checked="indeterminate">
        Disabled indeterminate checkbox
      </Checkbox>
    </div>
  ),
};

// Different Sizes
export const DifferentSizes: Story = {
  render: () => (
    <div className={stack({ gap: "4" })}>
      <Checkbox size="sm">Small checkbox</Checkbox>
      <Checkbox size="md">Medium checkbox (default)</Checkbox>
      <Checkbox size="lg">Large checkbox</Checkbox>
    </div>
  ),
};

// Multiple Checkboxes
export const MultipleCheckboxes: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const handleToggle = (item: string, checked: boolean) => {
      setSelectedItems((prev) =>
        checked ? [...prev, item] : prev.filter((i) => i !== item)
      );
    };

    return (
      <div className={stack({ gap: "2" })}>
        <Checkbox
          checked={selectedItems.includes("email")}
          onCheckedChange={(details) =>
            handleToggle("email", Boolean(details.checked))
          }
        >
          Email notifications
        </Checkbox>
        <Checkbox
          checked={selectedItems.includes("sms")}
          onCheckedChange={(details) =>
            handleToggle("sms", Boolean(details.checked))
          }
        >
          SMS notifications
        </Checkbox>
        <Checkbox
          checked={selectedItems.includes("push")}
          onCheckedChange={(details) =>
            handleToggle("push", Boolean(details.checked))
          }
        >
          Push notifications
        </Checkbox>
        <Checkbox
          checked={selectedItems.includes("marketing")}
          onCheckedChange={(details) =>
            handleToggle("marketing", Boolean(details.checked))
          }
        >
          Marketing emails
        </Checkbox>
      </div>
    );
  },
};

// Select All Pattern
export const SelectAllPattern: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const allItems = ["item1", "item2", "item3", "item4", "item5"];

    const allSelected = allItems.every((item) => selectedItems.includes(item));
    const someSelected = selectedItems.length > 0 && !allSelected;

    const handleSelectAll = (details: CheckedChangeDetails) => {
      const checked = Boolean(details.checked);
      setSelectedItems(checked ? allItems : []);
    };

    const handleToggleItem = (item: string, details: CheckedChangeDetails) => {
      const checked = Boolean(details.checked);
      setSelectedItems((prev) =>
        checked ? [...prev, item] : prev.filter((i) => i !== item)
      );
    };

    return (
      <div className={stack({ gap: "2" })}>
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={handleSelectAll}
        >
          Select all items
        </Checkbox>
        <div className={stack({ gap: "2", marginLeft: "6" })}>
          {allItems.map((item) => (
            <Checkbox
              key={item}
              checked={selectedItems.includes(item)}
              onCheckedChange={(details) => handleToggleItem(item, details)}
            >
              {item}
            </Checkbox>
          ))}
        </div>
      </div>
    );
  },
};

// Form Integration
export const FormIntegration: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      terms: false,
      newsletter: false,
      notifications: false,
    });

    const handleChange =
      (field: keyof typeof formData) => (details: CheckedChangeDetails) => {
        setFormData((prev) => ({ ...prev, [field]: Boolean(details.checked) }));
      };

    return (
      <div className={stack({ gap: "4", width: "400px" })}>
        <h3 className={css({ margin: "0 0 4 0" })}>Registration Form</h3>

        <Checkbox
          checked={formData.terms}
          onCheckedChange={handleChange("terms")}
        >
          I agree to the Terms of Service and Privacy Policy
        </Checkbox>

        <Checkbox
          checked={formData.newsletter}
          onCheckedChange={handleChange("newsletter")}
        >
          I would like to receive the newsletter
        </Checkbox>

        <Checkbox
          checked={formData.notifications}
          onCheckedChange={handleChange("notifications")}
        >
          Send me notifications about new features
        </Checkbox>

        <div
          className={css({
            marginTop: "4",
            padding: "4",
            backgroundColor: "gray.100",
            borderRadius: "md",
          })}
        >
          <strong>Form Data:</strong>
          <pre className={css({ margin: "2 0 0 0", fontSize: "sm" })}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
};

// Custom Styling
export const CustomStyling: Story = {
  render: () => (
    <div className={stack({ gap: "4" })}>
      <Checkbox size="lg">Large checkbox with custom styling</Checkbox>

      <Checkbox size="sm">Small checkbox for compact layouts</Checkbox>

      <div className={flex({ alignItems: "center", gap: "2" })}>
        <Checkbox size="md" />
        <span className={css({ fontSize: "sm", color: "gray.500" })}>
          Checkbox without label (custom label)
        </span>
      </div>
    </div>
  ),
};

// Accessibility Example
export const AccessibilityExample: Story = {
  render: () => (
    <div className={stack({ gap: "4" })}>
      <Checkbox aria-describedby="terms-description" aria-required="true">
        Accept terms and conditions
      </Checkbox>
      <div
        id="terms-description"
        className={css({ fontSize: "sm", color: "gray.500", marginLeft: "6" })}
      >
        You must accept the terms and conditions to continue.
        <a
          href="#"
          className={css({ color: "blue.600", textDecoration: "underline" })}
        >
          Read the full terms here
        </a>
      </div>

      <Checkbox aria-describedby="newsletter-description">
        Subscribe to newsletter
      </Checkbox>
      <div
        id="newsletter-description"
        className={css({ fontSize: "sm", color: "gray.500", marginLeft: "6" })}
      >
        Receive updates about new features and improvements. You can unsubscribe
        at any time.
      </div>
    </div>
  ),
};
