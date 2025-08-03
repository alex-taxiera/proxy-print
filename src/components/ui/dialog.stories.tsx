import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faUser,
  faCog,
  faSpaceShuttle,
} from "@fortawesome/free-solid-svg-icons";
import { IconButton } from "./icon-button";
import { Alert } from "./alert";

const meta: Meta<typeof Dialog.Root> = {
  title: "Core Components/Dialog",
  component: Dialog.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    modal: {
      control: { type: "boolean" },
      description:
        "Whether the dialog is modal (blocks interaction with other elements)",
    },
    open: {
      control: { type: "boolean" },
      description: "Whether the dialog is open",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Open Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>
            This is a basic dialog with a title and description. It can contain
            any content you need.
          </Dialog.Description>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const InfoDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <FontAwesomeIcon icon={faInfoCircle} />
          Show Info
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>
            <FontAwesomeIcon
              icon={faInfoCircle}
              style={{ marginRight: "0.5rem" }}
            />
            Information
          </Dialog.Title>
          <Dialog.Description>
            This is an informational dialog that provides important details to
            the user. It can contain helpful information, instructions, or
            explanations.
          </Dialog.Description>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const WarningDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" colorPalette="yellow">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Show Warning
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ marginRight: "0.5rem", color: "#f59e0b" }}
            />
            Warning
          </Dialog.Title>
          <Dialog.Description>
            This action cannot be undone. Are you sure you want to proceed with
            this operation? Please review your selection before confirming.
          </Dialog.Description>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Dialog.CloseTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.CloseTrigger>
            <Button colorPalette="red">Delete</Button>
          </div>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const SuccessDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button colorPalette="green">
          <FontAwesomeIcon icon={faCheckCircle} />
          Show Success
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ marginRight: "0.5rem", color: "#10b981" }}
            />
            Success!
          </Dialog.Title>
          <Dialog.Description>
            Your changes have been saved successfully. The operation completed
            without any issues.
          </Dialog.Description>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button colorPalette="green">Continue</Button>
          </div>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const FormDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faUser} />
          Add User
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Add New User</Dialog.Title>
          <Dialog.Description>
            Fill in the details below to create a new user account.
          </Dialog.Description>
          <form style={{ marginTop: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontWeight: "500",
                }}
              >
                Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontWeight: "500",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <Dialog.CloseTrigger asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button type="submit">Create User</Button>
            </div>
          </form>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const SettingsDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm">
          <FontAwesomeIcon icon={faCog} />
          Settings
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Application Settings</Dialog.Title>
          <Dialog.Description>
            Configure your application preferences and options.
          </Dialog.Description>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <input type="checkbox" defaultChecked />
                Enable notifications
              </label>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <input type="checkbox" />
                Dark mode
              </label>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <input type="checkbox" defaultChecked />
                Auto-save
              </label>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Dialog.CloseTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.CloseTrigger>
            <Button>Save Settings</Button>
          </div>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const LargeContentDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline">Show Large Content</Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Terms of Service</Dialog.Title>
          <Dialog.Description>
            Please read and accept our terms of service before continuing.
          </Dialog.Description>
          <div
            style={{
              marginTop: "1rem",
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
              padding: "1rem",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              1. Acceptance of Terms
            </h3>
            <p style={{ marginBottom: "1rem" }}>
              By accessing and using this application, you accept and agree to
              be bound by the terms and provision of this agreement.
            </p>

            <h3 style={{ marginBottom: "1rem" }}>2. Use License</h3>
            <p style={{ marginBottom: "1rem" }}>
              Permission is granted to temporarily download one copy of the
              materials (information or software) on this application for
              personal, non-commercial transitory viewing only.
            </p>

            <h3 style={{ marginBottom: "1rem" }}>3. Disclaimer</h3>
            <p style={{ marginBottom: "1rem" }}>
              The materials on this application are provided on an &lsquo;as
              is&rsquo; basis. We make no warranties, expressed or implied, and
              hereby disclaim and negate all other warranties including without
              limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of
              intellectual property or other violation of rights.
            </p>

            <h3 style={{ marginBottom: "1rem" }}>4. Limitations</h3>
            <p style={{ marginBottom: "1rem" }}>
              In no event shall we or our suppliers be liable for any damages
              (including, without limitation, damages for loss of data or
              profit, or due to business interruption) arising out of the use or
              inability to use the materials on this application.
            </p>
          </div>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Dialog.CloseTrigger asChild>
              <Button variant="outline">Decline</Button>
            </Dialog.CloseTrigger>
            <Button>Accept Terms</Button>
          </div>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" colorPalette="red">
          Delete Account
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Description>
            Are you absolutely sure you want to delete your account? This action
            cannot be undone and will permanently remove all your data,
            including:
          </Dialog.Description>
          <ul
            style={{
              marginTop: "0.5rem",
              marginBottom: "1rem",
              paddingLeft: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            <li>All your projects and files</li>
            <li>Account settings and preferences</li>
            <li>Billing information</li>
            <li>Team memberships</li>
          </ul>
          <Alert.Root status="error">
            <Alert.Icon>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </Alert.Icon>
            <Alert.Description>This action is irreversible!</Alert.Description>
          </Alert.Root>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Dialog.CloseTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.CloseTrigger>
            <Button colorPalette="red">Delete Account</Button>
          </div>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const NonModalDialog: Story = {
  render: () => (
    <Dialog.Root modal={false}>
      <Dialog.Trigger asChild>
        <Button variant="ghost">Non-Modal Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Non-Modal Dialog</Dialog.Title>
          <Dialog.Description>
            This dialog is not modal, so you can interact with other elements on
            the page while it&apos;s open.
          </Dialog.Description>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Dialog.CloseTrigger asChild>
              <Button>Close</Button>
            </Dialog.CloseTrigger>
          </div>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};

export const CustomCloseButton: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Custom Close Button</Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <Dialog.Title>Custom Close Button</Dialog.Title>
              <Dialog.Description>
                This dialog has a custom close button in the top-right corner.
              </Dialog.Description>
            </div>
          </div>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button>Confirm</Button>
          </div>
          <Dialog.CloseTrigger asChild>
            <IconButton
              position="absolute"
              right="2"
              top="2"
              size="sm"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faSpaceShuttle} />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
};
