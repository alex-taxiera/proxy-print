import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd } from "./kbd";
import { Menu } from "./menu";
import { css } from "styled-system/css";

const meta: Meta<typeof Kbd> = {
  title: "Core Components/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "The size of the keyboard shortcut display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Ctrl + S",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "⌘ + S",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    children: "Ctrl + Shift + P",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Ctrl + Alt + Delete",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      })}
    >
      <Kbd size="sm">⌘ + S</Kbd>
      <Kbd size="md">Ctrl + Z</Kbd>
      <Kbd size="lg">Ctrl + Shift + P</Kbd>
    </div>
  ),
};

export const CommonShortcuts: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "300px",
      })}
    >
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Save</span>
        <Kbd>Ctrl + S</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Undo</span>
        <Kbd>Ctrl + Z</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Redo</span>
        <Kbd>Ctrl + Y</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Find</span>
        <Kbd>Ctrl + F</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Select All</span>
        <Kbd>Ctrl + A</Kbd>
      </div>
    </div>
  ),
};

export const InMenu: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger>File Menu</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="new-file" justifyContent="space-between">
            <Menu.ItemText>New File</Menu.ItemText>
            <Kbd size="sm">Ctrl + N</Kbd>
          </Menu.Item>
          <Menu.Item value="open-file" justifyContent="space-between">
            <Menu.ItemText>Open File</Menu.ItemText>
            <Kbd size="sm">Ctrl + O</Kbd>
          </Menu.Item>
          <Menu.Item value="save" justifyContent="space-between">
            <Menu.ItemText>Save</Menu.ItemText>
            <Kbd size="sm">Ctrl + S</Kbd>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item value="print" justifyContent="space-between">
            <Menu.ItemText>Print</Menu.ItemText>
            <Kbd size="sm">Ctrl + P</Kbd>
          </Menu.Item>
          <Menu.Item value="exit" justifyContent="space-between">
            <Menu.ItemText>Exit</Menu.ItemText>
            <Kbd size="sm">Ctrl + Q</Kbd>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const MacShortcuts: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "300px",
      })}
    >
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Save</span>
        <Kbd>⌘ + S</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Undo</span>
        <Kbd>⌘ + Z</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Redo</span>
        <Kbd>⌘ + ⇧ + Z</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Find</span>
        <Kbd>⌘ + F</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Select All</span>
        <Kbd>⌘ + A</Kbd>
      </div>
    </div>
  ),
};

export const ComplexShortcuts: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "350px",
      })}
    >
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Toggle Developer Tools</span>
        <Kbd>F12</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Force Quit</span>
        <Kbd>Ctrl + Alt + Delete</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Switch Applications</span>
        <Kbd>Alt + Tab</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Take Screenshot</span>
        <Kbd>PrtScn</Kbd>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Refresh Page</span>
        <Kbd>F5</Kbd>
      </div>
    </div>
  ),
};
