import {
  faExternalLinkAlt,
  faArrowRight,
  faDownload,
  faHeart,
  faStar,
  faShare,
  faBookmark,
  faEdit,
  faEye,
  faTrash,
  faCog,
  faSearch,
  faFilter,
  faSort,
  faRefresh,
  faBell,
  faPlus,
  faMinus,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "./link";

const meta: Meta<typeof Link> = {
  title: "Core Components/Link",
  component: Link,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
      description: "The size of the link",
    },
    colorPalette: {
      control: { type: "select" },
      options: ["gray", "blue", "green", "red", "yellow"],
      description: "The color palette of the link",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the link is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Default Link",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <FontAwesomeIcon icon={faExternalLinkAlt} />
        External Link
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    "aria-label": "Settings",
    children: <FontAwesomeIcon icon={faCog} />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
      }}
    >
      <Link size="xs">Extra Small Link</Link>
      <Link size="sm">Small Link</Link>
      <Link size="md">Medium Link</Link>
      <Link size="lg">Large Link</Link>
      <Link size="xl">Extra Large Link</Link>
      <Link size="2xl">2XL Link</Link>
    </div>
  ),
};

export const ColorPalettes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
      }}
    >
      <Link colorPalette="gray">Gray Link</Link>
      <Link colorPalette="blue">Blue Link</Link>
      <Link colorPalette="green">Green Link</Link>
      <Link colorPalette="red">Red Link</Link>
      <Link colorPalette="yellow">Yellow Link</Link>
      <Link colorPalette="purple">Purple Link</Link>
      <Link colorPalette="orange">Orange Link</Link>
    </div>
  ),
};

export const NavigationLinks: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
      }}
    >
      <Link>
        <FontAwesomeIcon icon={faArrowRight} />
        Continue Reading
      </Link>
      <Link>
        <FontAwesomeIcon icon={faExternalLinkAlt} />
        Visit External Site
      </Link>
      <Link>
        <FontAwesomeIcon icon={faDownload} />
        Download File
      </Link>
      <Link>
        <FontAwesomeIcon icon={faCog} />
        Settings
      </Link>
      <Link>
        <FontAwesomeIcon icon={faSearch} />
        Search
      </Link>
    </div>
  ),
};

export const SocialLinks: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
      }}
    >
      <Link colorPalette="red">
        <FontAwesomeIcon icon={faHeart} />
        Like
      </Link>
      <Link colorPalette="yellow">
        <FontAwesomeIcon icon={faStar} />
        Star
      </Link>
      <Link colorPalette="blue">
        <FontAwesomeIcon icon={faShare} />
        Share
      </Link>
      <Link colorPalette="green">
        <FontAwesomeIcon icon={faBookmark} />
        Bookmark
      </Link>
      <Link>
        <FontAwesomeIcon icon={faDownload} />
        Download
      </Link>
    </div>
  ),
};

export const ActionLinks: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
      }}
    >
      <Link>
        <FontAwesomeIcon icon={faEdit} />
        Edit
      </Link>
      <Link>
        <FontAwesomeIcon icon={faEye} />
        View
      </Link>
      <Link colorPalette="red">
        <FontAwesomeIcon icon={faTrash} />
        Delete
      </Link>
      <Link>
        <FontAwesomeIcon icon={faCog} />
        Configure
      </Link>
      <Link>
        <FontAwesomeIcon icon={faRefresh} />
        Refresh
      </Link>
    </div>
  ),
};

export const ToolbarLinks: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Link size="sm">
        <FontAwesomeIcon icon={faSearch} />
        Search
      </Link>
      <Link size="sm">
        <FontAwesomeIcon icon={faFilter} />
        Filter
      </Link>
      <Link size="sm">
        <FontAwesomeIcon icon={faSort} />
        Sort
      </Link>
      <Link size="sm">
        <FontAwesomeIcon icon={faRefresh} />
        Refresh
      </Link>
      <Link size="sm">
        <FontAwesomeIcon icon={faBell} />
        Notifications
      </Link>
    </div>
  ),
};

export const FormActions: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Link colorPalette="green">
        <FontAwesomeIcon icon={faCheck} />
        Save
      </Link>
      <Link colorPalette="red">
        <FontAwesomeIcon icon={faTimes} />
        Cancel
      </Link>
      <Link>
        <FontAwesomeIcon icon={faPlus} />
        Add New
      </Link>
      <Link>
        <FontAwesomeIcon icon={faMinus} />
        Remove
      </Link>
    </div>
  ),
};

export const LinkGroup: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Link size="sm">Previous</Link>
      <Link size="sm">1</Link>
      <Link size="sm">2</Link>
      <Link size="sm">3</Link>
      <Link size="sm">Next</Link>
    </div>
  ),
};

export const BreadcrumbExample: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Link size="sm">Home</Link>
      <span style={{ color: "#666" }}>/</span>
      <Link size="sm">Products</Link>
      <span style={{ color: "#666" }}>/</span>
      <Link size="sm">Electronics</Link>
      <span style={{ color: "#666" }}>/</span>
      <Link size="sm" disabled>
        Smartphones
      </Link>
    </div>
  ),
};

export const FooterLinks: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "2rem",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        backgroundColor: "#f8fafc",
      }}
    >
      <Link size="sm">About Us</Link>
      <Link size="sm">Contact</Link>
      <Link size="sm">Privacy Policy</Link>
      <Link size="sm">Terms of Service</Link>
      <Link size="sm">Help Center</Link>
      <Link size="sm">Support</Link>
    </div>
  ),
};

export const SidebarNavigation: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "250px",
        padding: "1rem",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        backgroundColor: "#f8fafc",
      }}
    >
      <Link>
        <FontAwesomeIcon icon={faCog} />
        Dashboard
      </Link>
      <Link>
        <FontAwesomeIcon icon={faSearch} />
        Analytics
      </Link>
      <Link>
        <FontAwesomeIcon icon={faEdit} />
        Projects
      </Link>
      <Link>
        <FontAwesomeIcon icon={faEye} />
        Reports
      </Link>
      <Link>
        <FontAwesomeIcon icon={faBell} />
        Notifications
      </Link>
      <Link>
        <FontAwesomeIcon icon={faCog} />
        Settings
      </Link>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
      }}
    >
      <Link
        aria-label="Visit our documentation"
        onClick={() => alert("Documentation link clicked")}
      >
        Documentation
      </Link>
      <Link
        aria-describedby="external-link-desc"
        onClick={() => alert("External link clicked")}
      >
        <FontAwesomeIcon icon={faExternalLinkAlt} />
        External Resource
      </Link>
      <div
        id="external-link-desc"
        style={{ fontSize: "0.875rem", color: "#666" }}
      >
        This link will open in a new tab
      </div>
      <Link
        aria-label="Download user manual"
        onClick={() => alert("Download link clicked")}
      >
        <FontAwesomeIcon icon={faDownload} />
        Download Manual
      </Link>
    </div>
  ),
};
