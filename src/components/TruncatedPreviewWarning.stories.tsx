import type { Meta, StoryObj } from "@storybook/react-vite";

import { TruncatedPreviewWarning } from "./TruncatedPreviewWarning";

const meta: Meta<typeof TruncatedPreviewWarning> = {
  title: "Components/TruncatedPreviewWarning",
  component: TruncatedPreviewWarning,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    maxPages: {
      control: { type: "number" },
      description: "Maximum number of pages to show in preview",
    },
    totalPages: {
      control: { type: "number" },
      description: "Total number of pages in the document",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxPages: 3,
    totalPages: 5,
  },
};

export const NoWarning: Story = {
  args: {
    maxPages: 5,
    totalPages: 3,
  },
};

export const ManyPages: Story = {
  args: {
    maxPages: 3,
    totalPages: 15,
  },
};

export const EqualPages: Story = {
  args: {
    maxPages: 10,
    totalPages: 10,
  },
};
