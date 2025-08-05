import { SelectValueChangeDetails } from "@ark-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";
import { stack } from "styled-system/patterns";

import { Select, createListCollection } from "./select";

const meta: Meta<typeof Select.Root> = {
  title: "Core Components/Select",
  component: Select.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "The size of the select component",
    },
    variant: {
      control: { type: "select" },
      options: ["outline", "ghost"],
      description: "The visual variant of the select",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the select is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data collections
const countries = createListCollection({
  items: [
    { label: "United States", value: "us" },
    { label: "Canada", value: "ca" },
    { label: "United Kingdom", value: "uk" },
    { label: "Germany", value: "de" },
    { label: "France", value: "fr" },
    { label: "Japan", value: "jp" },
    { label: "Australia", value: "au" },
    { label: "Brazil", value: "br" },
  ],
});

const fruits = createListCollection({
  items: [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Orange", value: "orange" },
    { label: "Grape", value: "grape" },
    { label: "Strawberry", value: "strawberry" },
    { label: "Mango", value: "mango" },
  ],
});

const groupedOptions = createListCollection({
  items: [
    { label: "Fruits", value: "fruits", group: "Food" },
    { label: "Apple", value: "apple", group: "Fruits" },
    { label: "Banana", value: "banana", group: "Fruits" },
    { label: "Orange", value: "orange", group: "Fruits" },
    { label: "Vegetables", value: "vegetables", group: "Food" },
    { label: "Carrot", value: "carrot", group: "Vegetables" },
    { label: "Broccoli", value: "broccoli", group: "Vegetables" },
    { label: "Spinach", value: "spinach", group: "Vegetables" },
  ],
  groupBy: (item) => item.group,
});

// Basic Select
export const Default: Story = {
  render: () => (
    <Select.Root collection={countries}>
      <Select.Label>Country</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select a country" />
          <Select.Indicator asChild>
            <Select.IndicatorIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          <Select.List>
            {countries.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator asChild>
                  <Select.ItemIndicatorIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  ),
};

// With Default Value
export const WithDefaultValue: Story = {
  render: () => (
    <Select.Root collection={countries} defaultValue={["us"]}>
      <Select.Label>Country</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select a country" />
          <Select.Indicator asChild>
            <Select.IndicatorIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          <Select.List>
            {countries.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator asChild>
                  <Select.ItemIndicatorIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  ),
};

// Different Sizes
export const DifferentSizes: Story = {
  render: () => (
    <div className={stack({ gap: "4" })}>
      <Select.Root collection={fruits} size="sm">
        <Select.Label>Small Select</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose a fruit" />
            <Select.Indicator asChild>
              <Select.IndicatorIcon />
            </Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            <Select.List>
              {fruits.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>

      <Select.Root collection={fruits} size="md">
        <Select.Label>Medium Select (default)</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose a fruit" />
            <Select.Indicator asChild>
              <Select.IndicatorIcon />
            </Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            <Select.List>
              {fruits.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>

      <Select.Root collection={fruits} size="lg">
        <Select.Label>Large Select</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose a fruit" />
            <Select.Indicator asChild>
              <Select.IndicatorIcon />
            </Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            <Select.List>
              {fruits.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </div>
  ),
};

// Different Variants
export const DifferentVariants: Story = {
  render: () => (
    <div className={stack({ gap: "4" })}>
      <Select.Root collection={fruits} variant="outline">
        <Select.Label>Outline Variant (default)</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose a fruit" />
            <Select.Indicator asChild>
              <Select.IndicatorIcon />
            </Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            <Select.List>
              {fruits.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>

      <Select.Root collection={fruits} variant="ghost">
        <Select.Label>Ghost Variant</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose a fruit" />
            <Select.Indicator asChild>
              <Select.IndicatorIcon />
            </Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            <Select.List>
              {fruits.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </div>
  ),
};

// Disabled State
export const Disabled: Story = {
  render: () => (
    <Select.Root collection={fruits} disabled>
      <Select.Label>Disabled Select</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="This select is disabled" />
          <Select.Indicator asChild>
            <Select.IndicatorIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          <Select.List>
            {fruits.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator asChild>
                  <Select.ItemIndicatorIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  ),
};

// With Clear Button
export const WithClearButton: Story = {
  render: () => (
    <Select.Root collection={fruits}>
      <Select.Label>Select with Clear</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Choose a fruit" />
          <Select.ClearTrigger asChild>
            <Select.ClearIcon />
          </Select.ClearTrigger>
          <Select.Indicator asChild>
            <Select.IndicatorIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          <Select.List>
            {fruits.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator asChild>
                  <Select.ItemIndicatorIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  ),
};

// Grouped Options
export const GroupedOptions: Story = {
  render: () => (
    <Select.Root collection={groupedOptions}>
      <Select.Label>Grouped Options</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select a food item" />
          <Select.Indicator asChild>
            <Select.IndicatorIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {groupedOptions.group().map(([type, group]) => (
            <Select.ItemGroup key={type}>
              <Select.ItemGroupLabel>{type}</Select.ItemGroupLabel>
              {group.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.ItemGroup>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  ),
};

// Controlled Component
export const Controlled: Story = {
  render: () => {
    const [selectedValue, setSelectedValue] = useState<string[]>([]);

    return (
      <div className={stack({ gap: "4" })}>
        <Select.Root
          collection={fruits}
          value={selectedValue}
          onValueChange={(details) => setSelectedValue(details.value)}
        >
          <Select.Label>Controlled Select</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Choose a fruit" />
              <Select.Indicator asChild>
                <Select.IndicatorIcon />
              </Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              <Select.List>
                {fruits.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Select.ItemIndicatorIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select.Positioner>
        </Select.Root>

        <div
          className={css({
            padding: "4",
            backgroundColor: "gray.100",
            borderRadius: "md",
            fontSize: "sm",
          })}
        >
          <strong>Selected value:</strong> {selectedValue.join(", ") || "None"}
        </div>
      </div>
    );
  },
};

// Form Integration
export const FormIntegration: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      country: "",
      fruit: "",
    });

    const handleCountryChange = (details: SelectValueChangeDetails) => {
      setFormData((prev) => ({ ...prev, country: details.value[0] || "" }));
    };

    const handleFruitChange = (details: SelectValueChangeDetails) => {
      setFormData((prev) => ({ ...prev, fruit: details.value[0] || "" }));
    };

    return (
      <div className={stack({ gap: "4", width: "400px" })}>
        <h3 className={css({ margin: "0 0 4 0" })}>Registration Form</h3>

        <Select.Root
          collection={countries}
          value={formData.country ? [formData.country] : []}
          onValueChange={handleCountryChange}
        >
          <Select.Label>Country</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select your country" />
              <Select.Indicator asChild>
                <Select.IndicatorIcon />
              </Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              <Select.List>
                {countries.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Select.ItemIndicatorIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select.Positioner>
        </Select.Root>

        <Select.Root
          collection={fruits}
          value={formData.fruit ? [formData.fruit] : []}
          onValueChange={handleFruitChange}
        >
          <Select.Label>Favorite Fruit</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select your favorite fruit" />
              <Select.Indicator asChild>
                <Select.IndicatorIcon />
              </Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              <Select.List>
                {fruits.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Select.ItemIndicatorIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select.Positioner>
        </Select.Root>

        <div
          className={css({
            marginTop: "4",
            padding: "4",
            backgroundColor: "gray.100",
            borderRadius: "md",
          })}
        >
          <strong>Form Data:</strong>
          <pre className={css({ margin: "2 0 0 0", fontSize: "sm" })}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
};
