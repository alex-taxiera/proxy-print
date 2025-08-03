import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./field";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { css } from "styled-system/css";
import { grid, stack } from "styled-system/patterns";

const meta: Meta<typeof Field.Root> = {
  title: "Core Components/Field",
  component: Field.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    invalid: {
      control: { type: "boolean" },
      description: "Whether the field is in an invalid state",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the field is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Input Field
export const BasicInput: Story = {
  render: (args) => (
    <Field.Root {...args}>
      <Field.Label>Email Address</Field.Label>
      <Field.Input placeholder="Enter your email" />
      <Field.HelperText>
        We&apos;ll never share your email with anyone else.
      </Field.HelperText>
    </Field.Root>
  ),
};

// Input with Error
export const InputWithError: Story = {
  render: (args) => (
    <Field.Root {...args} invalid>
      <Field.Label>Email Address</Field.Label>
      <Field.Input placeholder="Enter your email" />
      <Field.ErrorText>Please enter a valid email address.</Field.ErrorText>
    </Field.Root>
  ),
};

// Input with Icon
export const InputWithIcon: Story = {
  render: (args) => (
    <Field.Root {...args}>
      <Field.Label>Username</Field.Label>
      <div className={css({ position: "relative" })}>
        <Field.Input
          placeholder="Enter your username"
          className={css({ paddingLeft: "2.5rem" })}
        />
        <FontAwesomeIcon
          icon={faUser}
          className={css({
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "fg.subtle",
          })}
        />
      </div>
      <Field.HelperText>
        Choose a unique username for your account.
      </Field.HelperText>
    </Field.Root>
  ),
};

// Textarea Field
export const TextareaField: Story = {
  render: (args) => (
    <Field.Root {...args}>
      <Field.Label>Bio</Field.Label>
      <Field.Textarea
        placeholder="Tell us about yourself..."
        rows={4}
        className={css({ resize: "vertical" })}
      />
      <Field.HelperText>
        Share a bit about yourself (optional).
      </Field.HelperText>
    </Field.Root>
  ),
};

// Disabled States
export const DisabledStates: Story = {
  render: () => (
    <div className={stack({ gap: "4", width: "400px" })}>
      <Field.Root disabled>
        <Field.Label>Disabled Input</Field.Label>
        <Field.Input placeholder="This input is disabled" />
        <Field.HelperText>This field cannot be edited.</Field.HelperText>
      </Field.Root>

      <Field.Root disabled>
        <Field.Label>Disabled Textarea</Field.Label>
        <Field.Textarea placeholder="This textarea is disabled" />
        <Field.HelperText>This field cannot be edited.</Field.HelperText>
      </Field.Root>
    </div>
  ),
};

// Validation States
export const ValidationStates: Story = {
  render: () => (
    <div className={stack({ gap: "4", width: "400px" })}>
      <Field.Root>
        <Field.Label>Valid Input</Field.Label>
        <Field.Input placeholder="This is valid" />
        <Field.HelperText>This field is valid.</Field.HelperText>
      </Field.Root>

      <Field.Root invalid>
        <Field.Label>Invalid Input</Field.Label>
        <Field.Input placeholder="This has an error" />
        <Field.ErrorText>This field has an error.</Field.ErrorText>
      </Field.Root>

      <Field.Root>
        <Field.Label>Required Field</Field.Label>
        <Field.Input placeholder="This field is required" required />
        <Field.HelperText>This field is required.</Field.HelperText>
      </Field.Root>
    </div>
  ),
};

// Complex Form Example
export const UserProfileForm: Story = {
  render: (args) => (
    <div className={stack({ gap: "6", width: "500px" })}>
      <h2
        className={css({
          margin: "0 0 4 0",
          fontSize: "1.5rem",
          fontWeight: "600",
        })}
      >
        User Profile
      </h2>

      <div className={grid({ columns: 2, gap: "4" })}>
        <Field.Root {...args}>
          <Field.Label>First Name</Field.Label>
          <Field.Input placeholder="John" />
        </Field.Root>

        <Field.Root {...args}>
          <Field.Label>Last Name</Field.Label>
          <Field.Input placeholder="Doe" />
        </Field.Root>
      </div>

      <Field.Root {...args}>
        <Field.Label>Email Address</Field.Label>
        <Field.Input type="email" placeholder="john.doe@example.com" />
        <Field.HelperText>
          We&apos;ll send a confirmation email to this address.
        </Field.HelperText>
      </Field.Root>

      <Field.Root {...args}>
        <Field.Label>Phone Number</Field.Label>
        <Field.Input type="tel" placeholder="+1 (555) 123-4567" />
      </Field.Root>

      <Field.Root {...args}>
        <Field.Label>Website</Field.Label>
        <Field.Input type="url" placeholder="https://example.com" />
        <Field.HelperText>Optional: Your personal website.</Field.HelperText>
      </Field.Root>

      <Field.Root {...args}>
        <Field.Label>Bio</Field.Label>
        <Field.Textarea
          placeholder="Tell us a bit about yourself..."
          rows={3}
          className={css({ resize: "vertical" })}
        />
        <Field.HelperText>
          Optional: Share a bit about yourself.
        </Field.HelperText>
      </Field.Root>

      <Field.Root {...args}>
        <Field.Label>Skills</Field.Label>
        <Field.Textarea
          placeholder="List your skills and expertise..."
          rows={2}
          className={css({ resize: "vertical" })}
        />
        <Field.HelperText>
          Optional: Describe your skills and experience.
        </Field.HelperText>
      </Field.Root>
    </div>
  ),
};
