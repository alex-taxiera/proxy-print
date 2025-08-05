import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { Pagination } from "./pagination";

const meta: Meta<typeof Pagination> = {
  title: "Core Components/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    count: {
      control: { type: "number", min: 1, max: 100 },
      description: "Total number of pages",
    },
    page: {
      control: { type: "number", min: 1 },
      description: "Current page number",
    },
    pageSize: {
      control: { type: "number", min: 1 },
      description: "Number of items per page",
    },
    siblingCount: {
      control: { type: "number", min: 0, max: 5 },
      description:
        "Number of sibling pages to show on each side of the current page",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 10,
    page: 1,
    pageSize: 1,
  },
};

export const WithManyPages: Story = {
  args: {
    count: 50,
    page: 1,
    pageSize: 1,
  },
};

export const CurrentPageInMiddle: Story = {
  args: {
    count: 20,
    page: 10,
    pageSize: 1,
  },
};

export const CurrentPageNearEnd: Story = {
  args: {
    count: 15,
    page: 13,
    pageSize: 1,
  },
};

export const CurrentPageNearStart: Story = {
  args: {
    count: 15,
    page: 3,
    pageSize: 1,
  },
};

export const WithEllipsis: Story = {
  args: {
    count: 100,
    page: 50,
    pageSize: 1,
  },
};

export const SmallPageCount: Story = {
  args: {
    count: 5,
    page: 1,
    pageSize: 1,
  },
};

export const SinglePage: Story = {
  args: {
    count: 1,
    page: 1,
    pageSize: 1,
  },
};

export const WithCustomSiblingCount: Story = {
  args: {
    count: 20,
    page: 10,
    pageSize: 1,
    siblingCount: 2,
  },
};

export const WithMinimalSiblingCount: Story = {
  args: {
    count: 20,
    page: 10,
    pageSize: 1,
    siblingCount: 0,
  },
};

export const Interactive: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 20;

    return (
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        })}
      >
        <div className={css({ fontSize: "0.875rem", color: "fg.muted" })}>
          Current Page: {currentPage} of {totalPages}
        </div>
        <Pagination
          count={totalPages}
          page={currentPage}
          pageSize={1}
          onPageChange={({ page }) => setCurrentPage(page)}
        />
      </div>
    );
  },
};

export const WithPageSize: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalItems = 100;
    const pageSize = 10;
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        })}
      >
        <div className={css({ fontSize: "0.875rem", color: "fg.muted" })}>
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
        </div>
        <Pagination
          count={totalPages}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={({ page }) => setCurrentPage(page)}
        />
      </div>
    );
  },
};

export const LargeDataset: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalItems = 10000;
    const pageSize = 25;
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        })}
      >
        <div className={css({ fontSize: "0.875rem", color: "fg.muted" })}>
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalItems)} of{" "}
          {totalItems.toLocaleString()} items
        </div>
        <Pagination
          count={totalPages}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={({ page }) => setCurrentPage(page)}
        />
      </div>
    );
  },
};

export const BoundaryCases: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        alignItems: "center",
      })}
    >
      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>First Page</h4>
        <Pagination count={10} page={1} pageSize={1} />
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Last Page</h4>
        <Pagination count={10} page={10} pageSize={1} />
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Single Page</h4>
        <Pagination count={1} page={1} pageSize={1} />
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Two Pages</h4>
        <Pagination count={2} page={1} pageSize={1} />
      </div>
    </div>
  ),
};

export const DifferentSiblingCounts: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        alignItems: "center",
      })}
    >
      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Sibling Count: 0</h4>
        <Pagination count={20} page={10} pageSize={1} siblingCount={0} />
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>
          Sibling Count: 1 (Default)
        </h4>
        <Pagination count={20} page={10} pageSize={1} siblingCount={1} />
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Sibling Count: 2</h4>
        <Pagination count={20} page={10} pageSize={1} siblingCount={2} />
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Sibling Count: 3</h4>
        <Pagination count={20} page={10} pageSize={1} siblingCount={3} />
      </div>
    </div>
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        alignItems: "center",
      })}
    >
      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>Compact Pagination</h4>
        <div className={css({ fontSize: "0.875rem" })}>
          <Pagination count={15} page={8} pageSize={1} />
        </div>
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>With Background</h4>
        <div
          className={css({
            padding: "1rem",
            backgroundColor: "bg.subtle",
            borderRadius: "md",
            display: "inline-block",
          })}
        >
          <Pagination count={12} page={6} pageSize={1} />
        </div>
      </div>

      <div>
        <h4 className={css({ marginBottom: "0.5rem" })}>
          Centered in Container
        </h4>
        <div
          className={css({
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            justifyContent: "center",
            padding: "1rem",
            border: "1px solid",
            borderColor: "border.default",
            borderRadius: "md",
          })}
        >
          <Pagination count={25} page={13} pageSize={1} />
        </div>
      </div>
    </div>
  ),
};

export const AccessibilityExample: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 15;

    return (
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        })}
      >
        <nav aria-label="Pagination Navigation">
          <Pagination
            count={totalPages}
            page={currentPage}
            pageSize={1}
            onPageChange={({ page }) => setCurrentPage(page)}
            aria-label={`Page ${currentPage} of ${totalPages}`}
          />
        </nav>
        <div className={css({ fontSize: "0.875rem", color: "fg.muted" })}>
          Navigate through pages using the pagination controls above
        </div>
      </div>
    );
  },
};
