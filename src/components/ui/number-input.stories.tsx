import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberInput } from "./number-input";
import { css } from "styled-system/css";
import { stack } from "styled-system/patterns";

const meta: Meta<typeof NumberInput> = {
  title: "Core Components/NumberInput",
  component: NumberInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: { type: "boolean" },
      description: "Whether the number input is disabled",
    },
    size: {
      control: { type: "select" },
      options: ["md", "lg", "xl"],
      description: "The size of the number input",
    },
    min: {
      control: { type: "number" },
      description: "Minimum value allowed",
    },
    max: {
      control: { type: "number" },
      description: "Maximum value allowed",
    },
    step: {
      control: { type: "number" },
      description: "Step increment for the number input",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Number Input
export const Basic: Story = {
  render: (args) => <NumberInput {...args}>Quantity</NumberInput>,
};

// Number Input with Min/Max
export const WithMinMax: Story = {
  render: (args) => (
    <NumberInput {...args} min={0} max={100}>
      Age
    </NumberInput>
  ),
};

// Number Input with Step
export const WithStep: Story = {
  render: (args) => (
    <NumberInput {...args} step={0.5}>
      Price
    </NumberInput>
  ),
};

// Number Input with Default Value
export const WithDefaultValue: Story = {
  render: (args) => (
    <NumberInput {...args} defaultValue="42">
      Default Value
    </NumberInput>
  ),
};

// Different Sizes
export const Sizes: Story = {
  render: () => (
    <div className={stack({ gap: "4", width: "300px" })}>
      <NumberInput size="md">Medium Size</NumberInput>
      <NumberInput size="lg">Large Size</NumberInput>
      <NumberInput size="xl">Extra Large Size</NumberInput>
    </div>
  ),
};

// Disabled State
export const Disabled: Story = {
  render: (args) => (
    <NumberInput {...args} disabled>
      Disabled Input
    </NumberInput>
  ),
};

// Number Input with Constraints
export const WithConstraints: Story = {
  render: (args) => (
    <div className={stack({ gap: "4", width: "300px" })}>
      <NumberInput {...args} min={0} max={10} step={1}>
        Rating (0-10)
      </NumberInput>
      <NumberInput {...args} min={-100} max={100} step={5}>
        Temperature (-100 to 100)
      </NumberInput>
      <NumberInput {...args} min={0} step={0.01}>
        Percentage (0.00)
      </NumberInput>
    </div>
  ),
};

// Number Input in Form Context
export const InForm: Story = {
  render: (args) => (
    <div className={stack({ gap: "6", width: "400px" })}>
      <h2
        className={css({
          margin: "0 0 4 0",
          fontSize: "1.5rem",
          fontWeight: "600",
        })}
      >
        Product Configuration
      </h2>

      <NumberInput {...args} min={1} max={1000}>
        Quantity
      </NumberInput>

      <NumberInput {...args} min={0} step={0.01}>
        Unit Price ($)
      </NumberInput>

      <NumberInput {...args} min={0} max={100} step={1}>
        Discount (%)
      </NumberInput>

      <NumberInput {...args} min={0} step={0.1}>
        Weight (kg)
      </NumberInput>
    </div>
  ),
};

// Number Input with Helper Text
export const WithHelperText: Story = {
  render: (args) => (
    <div className={stack({ gap: "1" })}>
      <NumberInput {...args} min={0} max={120}>
        Age
      </NumberInput>
      <p className={css({ fontSize: "sm", color: "fg.muted" })}>
        Please enter your age in years
      </p>
    </div>
  ),
};

// Number Input with Error State
export const WithError: Story = {
  render: (args) => (
    <div className={stack({ gap: "1" })}>
      <NumberInput {...args} min={0} max={100}>
        Score
      </NumberInput>
      <p className={css({ fontSize: "sm", color: "red.500" })}>
        Please enter a valid score between 0 and 100
      </p>
    </div>
  ),
};

// Number Input with Custom Step
export const CustomStep: Story = {
  render: (args) => (
    <div className={stack({ gap: "4", width: "300px" })}>
      <NumberInput {...args} step={1}>
        Whole Numbers
      </NumberInput>
      <NumberInput {...args} step={0.1}>
        One Decimal
      </NumberInput>
      <NumberInput {...args} step={0.01}>
        Two Decimals
      </NumberInput>
      <NumberInput {...args} step={0.001}>
        Three Decimals
      </NumberInput>
    </div>
  ),
};
