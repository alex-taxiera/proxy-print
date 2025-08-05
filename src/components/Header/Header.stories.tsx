import type { Meta, StoryObj } from "@storybook/react-vite";
import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    // Header component doesn't accept props, so no argTypes needed
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLongTitle: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "The header displays the main title and community banner. The title is centered and uses large typography.",
      },
    },
  },
};
