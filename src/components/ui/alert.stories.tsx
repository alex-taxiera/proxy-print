import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./alert";
import { Button } from "./button";

const meta: Meta<typeof Alert.Root> = {
  title: "Core Components/Alert",
  component: Alert.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: { type: "select" },
      options: ["info", "warning", "error", "success"],
      description: "The status variant of the alert",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: "info",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Information</Alert.Title>
        <Alert.Description>
          This is an informational alert. It provides useful information to the
          user.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const Info: Story = {
  args: {
    status: "info",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Information</Alert.Title>
        <Alert.Description>
          This is an informational alert. It provides useful information to the
          user.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const Warning: Story = {
  args: {
    status: "warning",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Warning</Alert.Title>
        <Alert.Description>
          This is a warning alert. It indicates a potential issue that should be
          addressed.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const Error: Story = {
  args: {
    status: "error",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>
          This is an error alert. It indicates a critical issue that needs
          immediate attention.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const Success: Story = {
  args: {
    status: "success",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Success</Alert.Title>
        <Alert.Description>
          This is a success alert. It indicates that an operation completed
          successfully.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const WithoutIcon: Story = {
  args: {
    status: "info",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.Content>
        <Alert.Title>No Icon</Alert.Title>
        <Alert.Description>
          This alert doesn&apos;t have an icon. Sometimes you might want to show
          alerts without icons.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const WithoutTitle: Story = {
  args: {
    status: "warning",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Description>
          This alert only has a description without a title. It&apos;s useful
          for simple messages.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const LongContent: Story = {
  args: {
    status: "error",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Critical System Error</Alert.Title>
        <Alert.Description>
          A critical error has occurred in the system. This error affects
          multiple components and may impact the overall functionality of the
          application. Please contact the system administrator immediately to
          resolve this issue. The error code is: ERR-2024-001.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "600px",
      }}
    >
      <Alert.Root status="info">
        <Alert.StatusIcon />
        <Alert.Content>
          <Alert.Title>Information</Alert.Title>
          <Alert.Description>
            This is an informational alert with useful details.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Alert.Root status="warning">
        <Alert.StatusIcon />
        <Alert.Content>
          <Alert.Title>Warning</Alert.Title>
          <Alert.Description>
            This is a warning alert that requires attention.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Alert.Root status="error">
        <Alert.StatusIcon />
        <Alert.Content>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>
            This is an error alert indicating a critical issue.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Alert.Root status="success">
        <Alert.StatusIcon />
        <Alert.Content>
          <Alert.Title>Success</Alert.Title>
          <Alert.Description>
            This is a success alert indicating a successful operation.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    status: "info",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Interactive Alert</Alert.Title>
        <Alert.Description>
          This alert contains interactive content. You can add buttons or other
          interactive elements here.
        </Alert.Description>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <Button onClick={() => alert("Action clicked!")}>Take Action</Button>
          <Button
            variant="outline"
            colorPalette="gray"
            onClick={() => alert("Dismissed!")}
          >
            Dismiss
          </Button>
        </div>
      </Alert.Content>
    </Alert.Root>
  ),
};

export const Dismissible: Story = {
  args: {
    status: "warning",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Dismissible Alert</Alert.Title>
        <Alert.Description>
          This alert can be dismissed by clicking the close button.
        </Alert.Description>
      </Alert.Content>
      <Alert.DismissButton onClick={() => alert("Alert dismissed!")} />
    </Alert.Root>
  ),
};

export const WithLinks: Story = {
  args: {
    status: "info",
  },
  render: (args) => (
    <Alert.Root {...args}>
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Alert with Links</Alert.Title>
        <Alert.Description>
          This alert contains links. You can learn more about{" "}
          <a
            href="#"
            style={{ color: "inherit", textDecoration: "underline" }}
            onClick={(e) => {
              e.preventDefault();
              alert("Link clicked!");
            }}
          >
            our privacy policy
          </a>{" "}
          or{" "}
          <a
            href="#"
            style={{ color: "inherit", textDecoration: "underline" }}
            onClick={(e) => {
              e.preventDefault();
              alert("Terms clicked!");
            }}
          >
            terms of service
          </a>
          .
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
};
