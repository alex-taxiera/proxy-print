import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { AlertToast, createToaster, Toaster } from "./toast";

const meta: Meta<typeof AlertToast> = {
  title: "Core Components/Toast",
  component: AlertToast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "info",
              title: "Toast Title",
              description: "Toast Description",
            });
          }}
        >
          Create Toast
        </Button>
      </>
    );
  },
};

export const SuccessToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "success",
              title: "Success!",
              description: "Your action was completed successfully.",
            });
          }}
        >
          Show Success Toast
        </Button>
      </>
    );
  },
};

export const ErrorToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "error",
              title: "Error Occurred",
              description: "Something went wrong. Please try again.",
            });
          }}
        >
          Show Error Toast
        </Button>
      </>
    );
  },
};

export const InfoToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "info",
              title: "Information",
              description: "Here's some useful information for you.",
            });
          }}
        >
          Show Info Toast
        </Button>
      </>
    );
  },
};

export const LoadingToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "loading",
              title: "Processing",
              description: "Please wait while we process your request...",
            });
          }}
        >
          Show Loading Toast
        </Button>
      </>
    );
  },
};

export const WarningToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "warning",
              title: "Warning",
              description: "Please review your input before proceeding.",
            });
          }}
        >
          Show Warning Toast
        </Button>
      </>
    );
  },
};

export const LongContentToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "info",
              title: "Important Update",
              description:
                "This is a very long description that demonstrates how the toast handles content that spans multiple lines. It should wrap appropriately and maintain good readability while providing comprehensive information to the user.",
            });
          }}
        >
          Show Long Content Toast
        </Button>
      </>
    );
  },
};

export const NoTitleToast: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Button
          onClick={() => {
            toaster.create({
              type: "info",
              title: "",
              description: "This toast only has a description without a title.",
            });
          }}
        >
          Show Toast Without Title
        </Button>
      </>
    );
  },
};

export const MultipleToasts: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Button
            onClick={() => {
              toaster.create({
                type: "success",
                title: "First Toast",
                description: "This is the first notification",
              });
            }}
          >
            Show Success Toast
          </Button>
          <Button
            onClick={() => {
              toaster.create({
                type: "error",
                title: "Second Toast",
                description: "This is the second notification",
              });
            }}
          >
            Show Error Toast
          </Button>
          <Button
            onClick={() => {
              toaster.create({
                type: "info",
                title: "Third Toast",
                description: "This is the third notification",
              });
            }}
          >
            Show Info Toast
          </Button>
        </div>
      </>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Button
            onClick={() => {
              toaster.create({
                type: "success",
                title: "Success Toast",
                description: "Operation completed successfully!",
              });
            }}
          >
            Success
          </Button>
          <Button
            onClick={() => {
              toaster.create({
                type: "error",
                title: "Error Toast",
                description: "An error occurred during the operation.",
              });
            }}
          >
            Error
          </Button>
          <Button
            onClick={() => {
              toaster.create({
                type: "warning",
                title: "Warning Toast",
                description: "Please review your input before proceeding.",
              });
            }}
          >
            Warning
          </Button>
          <Button
            onClick={() => {
              toaster.create({
                type: "info",
                title: "Info Toast",
                description: "Here's some helpful information.",
              });
            }}
          >
            Info
          </Button>
          <Button
            onClick={() => {
              toaster.create({
                type: "loading",
                title: "Loading Toast",
                description: "Processing your request...",
              });
            }}
          >
            Loading
          </Button>
        </div>
      </>
    );
  },
};

export const DifferentPlacements: Story = {
  render: () => {
    const topToaster = createToaster({ placement: "top" });
    const bottomToaster = createToaster({ placement: "bottom" });

    return (
      <>
        <Toaster toaster={topToaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Toaster toaster={bottomToaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: "400px",
          }}
        >
          <Button
            onClick={() => {
              topToaster.create({
                type: "info",
                title: "Top Placement",
                description: "This toast appears at the top of the screen.",
              });
            }}
          >
            Show Top Toast
          </Button>
          <Button
            onClick={() => {
              bottomToaster.create({
                type: "success",
                title: "Bottom Placement",
                description: "This toast appears at the bottom of the screen.",
              });
            }}
          >
            Show Bottom Toast
          </Button>
        </div>
      </>
    );
  },
};

export const NonClosableToasts: Story = {
  render: () => {
    const toaster = createToaster({
      placement: "top",
    });

    return (
      <>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>

        <Button
          onClick={() => {
            toaster.create({
              type: "info",
              closable: false,
              title: "Non-Closable Toast",
              description: "This toast cannot be closed by the user.",
            });
          }}
        >
          Show Non-Closable Toast
        </Button>
      </>
    );
  },
};

export const PersistentToasts: Story = {
  render: () => {
    const persistentToaster = createToaster({
      placement: "top",
      duration: Infinity, // Persistent
    });

    return (
      <>
        <Toaster toaster={persistentToaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Button
            onClick={() => {
              persistentToaster.create({
                type: "info",
                title: "Persistent Toast",
                description:
                  "This toast will not auto-dismiss. You must close it manually.",
              });
            }}
          >
            Show Persistent Toast
          </Button>
          <Button
            onClick={() => {
              persistentToaster.create({
                type: "error",
                title: "Critical Error",
                description:
                  "This is a critical error that requires user attention.",
              });
            }}
          >
            Show Critical Error
          </Button>
        </div>
      </>
    );
  },
};

export const ShortDurationToasts: Story = {
  render: () => {
    const shortToaster = createToaster({
      placement: "top",
      duration: 2000, // 2 seconds
    });

    return (
      <>
        <Toaster toaster={shortToaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Button
            onClick={() => {
              shortToaster.create({
                type: "success",
                title: "Quick Success",
                description: "This toast will disappear in 2 seconds.",
              });
            }}
          >
            Show Quick Success
          </Button>
          <Button
            onClick={() => {
              shortToaster.create({
                type: "info",
                title: "Quick Info",
                description: "Brief informational message.",
              });
            }}
          >
            Show Quick Info
          </Button>
        </div>
      </>
    );
  },
};

export const LongDurationToasts: Story = {
  render: () => {
    const longToaster = createToaster({
      placement: "top",
      duration: 10000, // 10 seconds
    });

    return (
      <>
        <Toaster toaster={longToaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Button
            onClick={() => {
              longToaster.create({
                type: "info",
                title: "Long Duration Toast",
                description:
                  "This toast will stay visible for 10 seconds before auto-dismissing.",
              });
            }}
          >
            Show Long Duration Toast
          </Button>
          <Button
            onClick={() => {
              longToaster.create({
                type: "warning",
                title: "Important Notice",
                description:
                  "This is an important notice that needs more time to read.",
              });
            }}
          >
            Show Important Notice
          </Button>
        </div>
      </>
    );
  },
};
