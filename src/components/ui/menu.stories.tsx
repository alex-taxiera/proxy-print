import { Portal } from "@ark-ui/react";
import {
  faEllipsisV,
  faEdit,
  faTrash,
  faCopy,
  faDownload,
  faShare,
  faStar,
  faHeart,
  faCog,
  faUser,
  faSignOutAlt,
  faChevronRight,
  faCheck,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { Button } from "./button";
import { Menu } from "./menu";

const meta: Meta<typeof Menu.Root> = {
  title: "Core Components/Menu",
  component: Menu.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg"],
      description: "The size of the menu items",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit">
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy">
              <Menu.ItemText>Copy</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="delete">
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit">
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy">
              <FontAwesomeIcon icon={faCopy} />
              <Menu.ItemText>Copy</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="download">
              <FontAwesomeIcon icon={faDownload} />
              <Menu.ItemText>Download</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="share">
              <FontAwesomeIcon icon={faShare} />
              <Menu.ItemText>Share</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="delete">
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const WithSeparators: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit">
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy">
              <FontAwesomeIcon icon={faCopy} />
              <Menu.ItemText>Copy</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.Item value="download">
              <FontAwesomeIcon icon={faDownload} />
              <Menu.ItemText>Download</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="share">
              <FontAwesomeIcon icon={faShare} />
              <Menu.ItemText>Share</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.Item value="delete">
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>File Actions</Menu.ItemGroupLabel>
            <Menu.Item value="edit">
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy">
              <FontAwesomeIcon icon={faCopy} />
              <Menu.ItemText>Copy</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="download">
              <FontAwesomeIcon icon={faDownload} />
              <Menu.ItemText>Download</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>Sharing</Menu.ItemGroupLabel>
            <Menu.Item value="share">
              <FontAwesomeIcon icon={faShare} />
              <Menu.ItemText>Share</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="favorite">
              <FontAwesomeIcon icon={faStar} />
              <Menu.ItemText>Add to Favorites</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>Danger Zone</Menu.ItemGroupLabel>
            <Menu.Item value="delete">
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const NestedMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Root positioning={{ gutter: 10 }}>
              <Menu.TriggerItem>JS Frameworks</Menu.TriggerItem>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="react">React</Menu.Item>
                    <Menu.Item value="solid">Solid</Menu.Item>
                    <Menu.Item value="vue">Vue</Menu.Item>
                    <Menu.Item value="svelte">Svelte</Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
            <Menu.Root positioning={{ gutter: 2 }}>
              <Menu.TriggerItem>CSS Frameworks</Menu.TriggerItem>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="panda">Panda</Menu.Item>
                    <Menu.Item value="tailwind">Tailwind</Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  ),
};

export const CheckboxMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faCog} />
          Settings
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.CheckboxItem value="notifications" checked={false}>
              <Menu.ItemIndicator>
                <FontAwesomeIcon icon={faCheck} />
              </Menu.ItemIndicator>
              <Menu.ItemText>Enable Notifications</Menu.ItemText>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem value="darkMode" checked={true}>
              <Menu.ItemIndicator>
                <FontAwesomeIcon icon={faCheck} />
              </Menu.ItemIndicator>
              <Menu.ItemText>Dark Mode</Menu.ItemText>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem value="autoSave" checked={false}>
              <Menu.ItemIndicator>
                <FontAwesomeIcon icon={faCheck} />
              </Menu.ItemIndicator>
              <Menu.ItemText>Auto Save</Menu.ItemText>
            </Menu.CheckboxItem>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const RadioMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faCog} />
          Theme
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.RadioItemGroup value="light">
              <Menu.RadioItem value="light">
                <Menu.ItemIndicator>
                  <FontAwesomeIcon icon={faCircle} />
                </Menu.ItemIndicator>
                <Menu.ItemText>Light Theme</Menu.ItemText>
              </Menu.RadioItem>
              <Menu.RadioItem value="dark">
                <Menu.ItemIndicator>
                  <FontAwesomeIcon icon={faCircle} />
                </Menu.ItemIndicator>
                <Menu.ItemText>Dark Theme</Menu.ItemText>
              </Menu.RadioItem>
              <Menu.RadioItem value="auto">
                <Menu.ItemIndicator>
                  <FontAwesomeIcon icon={faCircle} />
                </Menu.ItemIndicator>
                <Menu.ItemText>Auto</Menu.ItemText>
              </Menu.RadioItem>
            </Menu.RadioItemGroup>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const ContextMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.ContextTrigger>
        <div
          className={css({
            padding: "8",
            border: "2px dashed",
            borderColor: "border.default",
            borderRadius: "l2",
            textAlign: "center",
            userSelect: "none",
          })}
        >
          <p>Right-click here to open context menu</p>
        </div>
      </Menu.ContextTrigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit">
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy">
              <FontAwesomeIcon icon={faCopy} />
              <Menu.ItemText>Copy</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="download">
              <FontAwesomeIcon icon={faDownload} />
              <Menu.ItemText>Download</Menu.ItemText>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="delete">
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div
      className={css({ display: "flex", gap: "8", alignItems: "flex-start" })}
    >
      <div>
        <h4>Extra Small</h4>
        <Menu.Root size="xs">
          <Menu.Trigger asChild>
            <Button>Actions</Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item value="edit">
                  <Menu.ItemText>Edit</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="copy">
                  <Menu.ItemText>Copy</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="delete">
                  <Menu.ItemText>Delete</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </div>

      <div>
        <h4>Small</h4>
        <Menu.Root size="sm">
          <Menu.Trigger asChild>
            <Button>Actions</Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item value="edit">
                  <Menu.ItemText>Edit</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="copy">
                  <Menu.ItemText>Copy</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="delete">
                  <Menu.ItemText>Delete</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </div>

      <div>
        <h4>Medium</h4>
        <Menu.Root size="md">
          <Menu.Trigger asChild>
            <Button>Actions</Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item value="edit">
                  <Menu.ItemText>Edit</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="copy">
                  <Menu.ItemText>Copy</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="delete">
                  <Menu.ItemText>Delete</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </div>

      <div>
        <h4>Large</h4>
        <Menu.Root size="lg">
          <Menu.Trigger asChild>
            <Button>Actions</Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item value="edit">
                  <Menu.ItemText>Edit</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="copy">
                  <Menu.ItemText>Copy</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="delete">
                  <Menu.ItemText>Delete</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </div>
    </div>
  ),
};

export const DisabledItems: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit">
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy" disabled>
              <FontAwesomeIcon icon={faCopy} />
              <Menu.ItemText>Copy (Disabled)</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="download">
              <FontAwesomeIcon icon={faDownload} />
              <Menu.ItemText>Download</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="share" disabled>
              <FontAwesomeIcon icon={faShare} />
              <Menu.ItemText>Share (Disabled)</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="delete">
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const WithIndicators: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="selected">
              <Menu.ItemIndicator>
                <FontAwesomeIcon icon={faCheck} />
              </Menu.ItemIndicator>
              <Menu.ItemText>Selected Item</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="regular">
              <Menu.ItemText>Regular Item</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="starred">
              <Menu.ItemIndicator>
                <FontAwesomeIcon icon={faStar} />
              </Menu.ItemIndicator>
              <Menu.ItemText>Starred Item</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const UserProfileMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faUser} />
          John Doe
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="profile">
              <FontAwesomeIcon icon={faUser} />
              <Menu.ItemText>Profile</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="settings">
              <FontAwesomeIcon icon={faCog} />
              <Menu.ItemText>Settings</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="favorites">
              <FontAwesomeIcon icon={faHeart} />
              <Menu.ItemText>Favorites</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.Item value="signout">
              <FontAwesomeIcon icon={faSignOutAlt} />
              <Menu.ItemText>Sign Out</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const ComplexNestedMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          More Actions
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit">
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.TriggerItem>
              <FontAwesomeIcon icon={faShare} />
              <Menu.ItemText>Share</Menu.ItemText>
              <FontAwesomeIcon icon={faChevronRight} />
            </Menu.TriggerItem>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.ItemGroup>
                  <Menu.Item value="share-user">
                    <FontAwesomeIcon icon={faUser} />
                    <Menu.ItemText>Share with User</Menu.ItemText>
                  </Menu.Item>
                  <Menu.TriggerItem>
                    <FontAwesomeIcon icon={faDownload} />
                    <Menu.ItemText>Share via Link</Menu.ItemText>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Menu.TriggerItem>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.ItemGroup>
                        <Menu.Item value="copy-link">
                          <Menu.ItemText>Copy Link</Menu.ItemText>
                        </Menu.Item>
                        <Menu.Item value="qr-code">
                          <Menu.ItemText>Generate QR Code</Menu.ItemText>
                        </Menu.Item>
                      </Menu.ItemGroup>
                    </Menu.Content>
                  </Menu.Positioner>
                  <Menu.Item value="share-email">
                    <FontAwesomeIcon icon={faShare} />
                    <Menu.ItemText>Share via Email</Menu.ItemText>
                  </Menu.Item>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
            <Menu.Item value="delete">
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button>
          <FontAwesomeIcon icon={faEllipsisV} />
          Interactive Menu
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.Item value="edit" onClick={() => alert("Edit clicked!")}>
              <FontAwesomeIcon icon={faEdit} />
              <Menu.ItemText>Edit (Click me!)</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="copy" onClick={() => alert("Copy clicked!")}>
              <FontAwesomeIcon icon={faCopy} />
              <Menu.ItemText>Copy (Click me!)</Menu.ItemText>
            </Menu.Item>
            <Menu.Item
              value="download"
              onClick={() => alert("Download clicked!")}
            >
              <FontAwesomeIcon icon={faDownload} />
              <Menu.ItemText>Download (Click me!)</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="delete" onClick={() => alert("Delete clicked!")}>
              <FontAwesomeIcon icon={faTrash} />
              <Menu.ItemText>Delete (Click me!)</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};
