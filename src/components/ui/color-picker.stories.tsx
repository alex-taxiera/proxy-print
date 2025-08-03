import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorPicker } from "./color-picker";

const meta: Meta<typeof ColorPicker> = {
  title: "Core Components/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    format: {
      control: { type: "select" },
      options: ["rgba", "hsla", "hsba"],
      description: "The color format to use",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the color picker is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic ColorPicker
export const Default: Story = {
  render: () => <ColorPicker />,
};
