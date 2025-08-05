import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Spinner } from "./spinner";

const meta: Meta<typeof Spinner> = {
  title: "Core Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the spinner",
    },
    label: {
      control: { type: "text" },
      description: "Accessibility label for screen readers",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Loading...",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    label: "Loading...",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    label: "Loading...",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    label: "Loading...",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    label: "Loading...",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Spinner size="xs" label="Extra small spinner" />
        <span style={{ fontSize: "0.75rem" }}>Extra Small</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Spinner size="sm" label="Small spinner" />
        <span style={{ fontSize: "0.75rem" }}>Small</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Spinner size="md" label="Medium spinner" />
        <span style={{ fontSize: "0.75rem" }}>Medium</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Spinner size="lg" label="Large spinner" />
        <span style={{ fontSize: "0.75rem" }}>Large</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Spinner size="xl" label="Extra large spinner" />
        <span style={{ fontSize: "0.75rem" }}>Extra Large</span>
      </div>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Spinner size="sm" label="Loading data" />
        <span>Loading data...</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Spinner size="md" label="Processing request" />
        <span>Processing your request...</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Spinner size="lg" label="Saving changes" />
        <span>Saving your changes...</span>
      </div>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <Button disabled>
        <Spinner size="sm" label="Loading" />
        <span style={{ marginLeft: "0.5rem" }}>Loading...</span>
      </Button>

      <Button variant="outline" disabled>
        <Spinner size="sm" label="Processing" />
        <span style={{ marginLeft: "0.5rem" }}>Processing...</span>
      </Button>

      <Button colorPalette="green" disabled>
        <Spinner size="sm" label="Saving" />
        <span style={{ marginLeft: "0.5rem" }}>Saving...</span>
      </Button>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "2rem",
        maxWidth: "400px",
        textAlign: "center",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Loading Content</h3>
      <p style={{ marginBottom: "1.5rem", color: "#6b7280" }}>
        Please wait while we load your content...
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <Spinner size="lg" label="Loading content" />
      </div>
      <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
        This may take a few moments
      </p>
    </div>
  ),
};

export const Centered: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        border: "1px dashed #d1d5db",
        borderRadius: "0.5rem",
      }}
    >
      <Spinner size="xl" label="Loading" />
    </div>
  ),
};

export const Overlay: Story = {
  render: () => (
    <div style={{ position: "relative", width: "400px", height: "300px" }}>
      {/* Simulated content */}
      <div
        style={{
          padding: "2rem",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3 style={{ marginTop: 0 }}>Sample Content</h3>
          <p>This is some sample content that would normally be visible.</p>
          <p>
            When loading, this content might be replaced with a spinner overlay.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </div>
      </div>

      {/* Loading overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
          borderRadius: "0.5rem",
        }}
      >
        <Spinner size="lg" label="Loading content" />
        <span style={{ color: "#6b7280" }}>Loading...</span>
      </div>
    </div>
  ),
};

export const NoLabel: Story = {
  args: {
    label: "",
  },
};

export const CustomLabel: Story = {
  args: {
    label: "Please wait while we process your request...",
  },
};

export const Inline: Story = {
  render: () => (
    <div style={{ fontSize: "1rem", lineHeight: "1.5" }}>
      <p>
        This is a paragraph with an inline spinner:{" "}
        <Spinner size="sm" label="Loading" /> that shows loading state.
      </p>
      <p>
        You can also have multiple spinners:{" "}
        <Spinner size="xs" label="Processing" />{" "}
        <Spinner size="xs" label="Loading" /> in the same line.
      </p>
    </div>
  ),
};
