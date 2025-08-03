import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faDownload, 
  faHeart, 
  faStar, 
  faTrash, 
  faPlus,
  faArrowRight,
  faCog
} from '@fortawesome/free-solid-svg-icons'

const meta: Meta<typeof Button> = {
  title: 'Core Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['solid', 'outline', 'ghost', 'link', 'subtle'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'The size of the button',
    },
    colorPalette: {
      control: { type: 'select' },
      options: ['gray', 'blue', 'green', 'red', 'yellow'],
      description: 'The color palette of the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the button is in a loading state',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Primary: Story = {
  args: {
    variant: 'solid',
    colorPalette: 'blue',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'outline',
    children: 'Secondary Button',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
}

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    children: 'Subtle Button',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'solid',
    children: (
      <>
        <FontAwesomeIcon icon={faDownload} />
        Download
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    children: <FontAwesomeIcon icon={faHeart} />,
    'aria-label': 'Like',
  },
}

export const Loading: Story = {
  args: {
    variant: 'solid',
    loading: true,
    children: 'Loading Button',
  },
}

export const LoadingWithText: Story = {
  args: {
    variant: 'solid',
    loading: true,
    loadingText: 'Processing...',
    children: 'Submit',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'solid',
    disabled: true,
    children: 'Disabled Button',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button variant="solid">Solid Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="link">Link Button</Button>
      <Button variant="subtle">Subtle Button</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="2xl">2XL</Button>
    </div>
  ),
}

export const ColorPalettes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button colorPalette="gray">Gray</Button>
      <Button colorPalette="blue">Blue</Button>
      <Button colorPalette="green">Green</Button>
      <Button colorPalette="red">Red</Button>
      <Button colorPalette="yellow">Yellow</Button>
      <Button colorPalette="purple">Purple</Button>
      <Button colorPalette="orange">Orange</Button>
    </div>
  ),
}

export const OutlineColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button variant="outline" colorPalette="gray">Gray Outline</Button>
      <Button variant="outline" colorPalette="blue">Blue Outline</Button>
      <Button variant="outline" colorPalette="green">Green Outline</Button>
      <Button variant="outline" colorPalette="red">Red Outline</Button>
      <Button variant="outline" colorPalette="yellow">Yellow Outline</Button>
      <Button variant="outline" colorPalette="purple">Purple Outline</Button>
      <Button variant="outline" colorPalette="orange">Orange Outline</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button>
        <FontAwesomeIcon icon={faDownload} />
        Download
      </Button>
      <Button variant="outline">
        <FontAwesomeIcon icon={faHeart} />
        Like
      </Button>
      <Button variant="ghost">
        <FontAwesomeIcon icon={faStar} />
        Star
      </Button>
      <Button variant="subtle" colorPalette="red">
        <FontAwesomeIcon icon={faTrash} />
        Delete
      </Button>
      <Button variant="link">
        <FontAwesomeIcon icon={faArrowRight} />
        Continue
      </Button>
    </div>
  ),
}

export const IconButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button variant="ghost" size="sm" aria-label="Settings">
        <FontAwesomeIcon icon={faCog} />
      </Button>
      <Button variant="ghost" size="md" aria-label="Like">
        <FontAwesomeIcon icon={faHeart} />
      </Button>
      <Button variant="ghost" size="lg" aria-label="Star">
        <FontAwesomeIcon icon={faStar} />
      </Button>
      <Button variant="outline" size="md" aria-label="Add">
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <Button variant="solid" colorPalette="red" size="md" aria-label="Delete">
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button loading>Loading Button</Button>
      <Button loading loadingText="Processing...">
        Submit Form
      </Button>
      <Button variant="outline" loading>
        Loading Outline
      </Button>
      <Button variant="ghost" loading loadingText="Saving...">
        Save Changes
      </Button>
    </div>
  ),
}

export const DisabledStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button disabled>Disabled Solid</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
      <Button variant="ghost" disabled>Disabled Ghost</Button>
      <Button variant="link" disabled>Disabled Link</Button>
      <Button variant="subtle" disabled>Disabled Subtle</Button>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <Button 
        onClick={() => alert('Button clicked!')}
      >
        Click Me
      </Button>
      <Button 
        variant="outline"
        onClick={() => alert('Outline button clicked!')}
      >
        Outline Click
      </Button>
      <Button 
        variant="ghost"
        onClick={() => alert('Ghost button clicked!')}
      >
        Ghost Click
      </Button>
    </div>
  ),
}

export const FormButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button type="submit" colorPalette="green">
        Submit
      </Button>
      <Button type="button" variant="outline">
        Cancel
      </Button>
      <Button type="reset" variant="ghost" colorPalette="red">
        Reset
      </Button>
    </div>
  ),
}

export const ButtonGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button size="sm">Previous</Button>
        <Button size="sm" variant="outline">1</Button>
        <Button size="sm" variant="outline">2</Button>
        <Button size="sm" variant="outline">3</Button>
        <Button size="sm">Next</Button>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="outline">
          <FontAwesomeIcon icon={faHeart} />
        </Button>
        <Button variant="outline">
          <FontAwesomeIcon icon={faStar} />
        </Button>
        <Button variant="outline">
          <FontAwesomeIcon icon={faDownload} />
        </Button>
      </div>
    </div>
  ),
}
