import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./icon-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faStar,
  faTrash,
  faPlus,
  faCog,
  faDownload,
  faEdit,
  faEye,
  faShare,
  faBookmark,
  faBell,
  faSearch,
  faFilter,
  faSort,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";

const meta: Meta<typeof IconButton> = {
  title: "Core Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["solid", "outline", "ghost", "link", "subtle"],
      description: "The visual style variant of the icon button",
    },
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
      description: "The size of the icon button",
    },
    colorPalette: {
      control: { type: "select" },
      options: ["gray", "blue", "green", "red", "yellow"],
      description: "The color palette of the icon button",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the icon button is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "aria-label": "Settings",
    children: <FontAwesomeIcon icon={faCog} />,
  },
};

export const Solid: Story = {
  args: {
    variant: "solid",
    "aria-label": "Like",
    children: <FontAwesomeIcon icon={faHeart} />,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    "aria-label": "Star",
    children: <FontAwesomeIcon icon={faStar} />,
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    "aria-label": "Settings",
    children: <FontAwesomeIcon icon={faCog} />,
  },
};

export const Subtle: Story = {
  args: {
    variant: "subtle",
    "aria-label": "Add",
    children: <FontAwesomeIcon icon={faPlus} />,
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    "aria-label": "Share",
    children: <FontAwesomeIcon icon={faShare} />,
  },
};

export const Disabled: Story = {
  args: {
    variant: "solid",
    disabled: true,
    "aria-label": "Disabled button",
    children: <FontAwesomeIcon icon={faHeart} />,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton variant="solid" aria-label="Solid">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton variant="outline" aria-label="Outline">
        <FontAwesomeIcon icon={faStar} />
      </IconButton>
      <IconButton variant="ghost" aria-label="Ghost">
        <FontAwesomeIcon icon={faCog} />
      </IconButton>
      <IconButton variant="subtle" aria-label="Subtle">
        <FontAwesomeIcon icon={faPlus} />
      </IconButton>
      <IconButton variant="link" aria-label="Link">
        <FontAwesomeIcon icon={faShare} />
      </IconButton>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton size="xs" aria-label="Extra Small">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton size="sm" aria-label="Small">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton size="md" aria-label="Medium">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton size="lg" aria-label="Large">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton size="xl" aria-label="Extra Large">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton size="2xl" aria-label="2XL">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
    </div>
  ),
};

export const ColorPalettes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton colorPalette="gray" aria-label="Gray">
        <FontAwesomeIcon icon={faCog} />
      </IconButton>
      <IconButton colorPalette="blue" aria-label="Blue">
        <FontAwesomeIcon icon={faDownload} />
      </IconButton>
      <IconButton colorPalette="green" aria-label="Green">
        <FontAwesomeIcon icon={faPlus} />
      </IconButton>
      <IconButton colorPalette="red" aria-label="Red">
        <FontAwesomeIcon icon={faTrash} />
      </IconButton>
      <IconButton colorPalette="yellow" aria-label="Yellow">
        <FontAwesomeIcon icon={faStar} />
      </IconButton>
    </div>
  ),
};

export const CommonActions: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton variant="ghost" aria-label="Edit">
        <FontAwesomeIcon icon={faEdit} />
      </IconButton>
      <IconButton variant="ghost" aria-label="View">
        <FontAwesomeIcon icon={faEye} />
      </IconButton>
      <IconButton variant="ghost" aria-label="Share">
        <FontAwesomeIcon icon={faShare} />
      </IconButton>
      <IconButton variant="ghost" colorPalette="red" aria-label="Delete">
        <FontAwesomeIcon icon={faTrash} />
      </IconButton>
      <IconButton variant="ghost" colorPalette="yellow" aria-label="Bookmark">
        <FontAwesomeIcon icon={faBookmark} />
      </IconButton>
    </div>
  ),
};

export const NavigationActions: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton variant="outline" aria-label="Search">
        <FontAwesomeIcon icon={faSearch} />
      </IconButton>
      <IconButton variant="outline" aria-label="Filter">
        <FontAwesomeIcon icon={faFilter} />
      </IconButton>
      <IconButton variant="outline" aria-label="Sort">
        <FontAwesomeIcon icon={faSort} />
      </IconButton>
      <IconButton variant="outline" aria-label="Refresh">
        <FontAwesomeIcon icon={faRefresh} />
      </IconButton>
      <IconButton variant="outline" aria-label="Notifications">
        <FontAwesomeIcon icon={faBell} />
      </IconButton>
    </div>
  ),
};

export const SocialActions: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton variant="ghost" colorPalette="red" aria-label="Like">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton variant="ghost" colorPalette="yellow" aria-label="Star">
        <FontAwesomeIcon icon={faStar} />
      </IconButton>
      <IconButton variant="ghost" colorPalette="blue" aria-label="Share">
        <FontAwesomeIcon icon={faShare} />
      </IconButton>
      <IconButton variant="ghost" colorPalette="green" aria-label="Bookmark">
        <FontAwesomeIcon icon={faBookmark} />
      </IconButton>
      <IconButton variant="ghost" aria-label="Download">
        <FontAwesomeIcon icon={faDownload} />
      </IconButton>
    </div>
  ),
};

export const DisabledStates: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton variant="solid" disabled aria-label="Disabled Solid">
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton variant="outline" disabled aria-label="Disabled Outline">
        <FontAwesomeIcon icon={faStar} />
      </IconButton>
      <IconButton variant="ghost" disabled aria-label="Disabled Ghost">
        <FontAwesomeIcon icon={faCog} />
      </IconButton>
      <IconButton variant="subtle" disabled aria-label="Disabled Subtle">
        <FontAwesomeIcon icon={faPlus} />
      </IconButton>
      <IconButton variant="link" disabled aria-label="Disabled Link">
        <FontAwesomeIcon icon={faShare} />
      </IconButton>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton
        variant="ghost"
        aria-label="Like"
        onClick={() => alert("Liked!")}
      >
        <FontAwesomeIcon icon={faHeart} />
      </IconButton>
      <IconButton
        variant="outline"
        aria-label="Star"
        onClick={() => alert("Starred!")}
      >
        <FontAwesomeIcon icon={faStar} />
      </IconButton>
      <IconButton
        variant="solid"
        colorPalette="red"
        aria-label="Delete"
        onClick={() => alert("Delete clicked!")}
      >
        <FontAwesomeIcon icon={faTrash} />
      </IconButton>
    </div>
  ),
};

export const ButtonGroup: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <IconButton variant="outline" size="sm" aria-label="Previous">
          <FontAwesomeIcon icon={faCog} />
        </IconButton>
        <IconButton variant="outline" size="sm" aria-label="Next">
          <FontAwesomeIcon icon={faCog} />
        </IconButton>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <IconButton variant="ghost" aria-label="Edit">
          <FontAwesomeIcon icon={faEdit} />
        </IconButton>
        <IconButton variant="ghost" aria-label="View">
          <FontAwesomeIcon icon={faEye} />
        </IconButton>
        <IconButton variant="ghost" colorPalette="red" aria-label="Delete">
          <FontAwesomeIcon icon={faTrash} />
        </IconButton>
      </div>
    </div>
  ),
};

export const ToolbarExample: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        padding: "1rem",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        backgroundColor: "#f8fafc",
      }}
    >
      <IconButton variant="ghost" size="sm" aria-label="Bold">
        <FontAwesomeIcon icon={faEdit} />
      </IconButton>
      <IconButton variant="ghost" size="sm" aria-label="Italic">
        <FontAwesomeIcon icon={faEye} />
      </IconButton>
      <IconButton variant="ghost" size="sm" aria-label="Underline">
        <FontAwesomeIcon icon={faShare} />
      </IconButton>
      <div
        style={{ width: "1px", height: "1.5rem", backgroundColor: "#e2e8f0" }}
      />
      <IconButton variant="ghost" size="sm" aria-label="Align Left">
        <FontAwesomeIcon icon={faCog} />
      </IconButton>
      <IconButton variant="ghost" size="sm" aria-label="Align Center">
        <FontAwesomeIcon icon={faSearch} />
      </IconButton>
      <IconButton variant="ghost" size="sm" aria-label="Align Right">
        <FontAwesomeIcon icon={faFilter} />
      </IconButton>
    </div>
  ),
};
