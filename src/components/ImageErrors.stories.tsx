import { Meta, StoryObj } from "@storybook/react-vite";
import { ImageErrors } from "./ImageErrors";

const meta: Meta<typeof ImageErrors> = {
  title: "Components/ImageErrors",
  component: ImageErrors,
  tags: ["autodocs"],
  argTypes: {
    imagesWithError: {
      control: { type: "object" },
      description: "Array of images with errors",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onDismiss: () => {
      alert("Dismissed Errors");
    },
    imagesWithError: [
      {
        uuid: "1",
        name: "Image 1",
        id: "1",
      },
    ],
  },
};

export const NoErrors: Story = {
  args: {
    onDismiss: () => {
      alert("Dismissed Errors");
    },
    imagesWithError: [],
  },
};

export const ManyErrors: Story = {
  args: {
    onDismiss: () => {
      alert("Dismissed Errors");
    },
    imagesWithError: Array.from({ length: 10 }, (_, i) => ({
      uuid: `error-${i}`,
      name: `Image ${i}`,
      id: `error-${i}`,
    })),
  },
};
