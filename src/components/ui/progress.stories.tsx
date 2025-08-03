import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from './progress'
import { useState, useEffect } from 'react'

const meta: Meta<typeof Progress> = {
  title: 'Core Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['linear', 'circular'],
      description: 'The type of progress to render',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the progress component',
    },
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The current progress value (0-100)',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'The maximum progress value',
    },
    min: {
      control: { type: 'number', min: 0 },
      description: 'The minimum progress value',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 50,
    children: 'Progress',
  },
}

export const Linear: Story = {
  args: {
    type: 'linear',
    value: 75,
    children: 'Linear Progress',
  },
}

export const Circular: Story = {
  args: {
    type: 'circular',
    value: 60,
    children: 'Circular Progress',
  },
}

export const WithLabel: Story = {
  args: {
    value: 45,
    children: 'Upload Progress',
  },
}

export const WithoutLabel: Story = {
  args: {
    value: 30,
  },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
      <div>
        <h3>Small</h3>
        <Progress size="sm" value={25}>Small Progress</Progress>
      </div>
      <div>
        <h3>Medium</h3>
        <Progress size="md" value={50}>Medium Progress</Progress>
      </div>
      <div>
        <h3>Large</h3>
        <Progress size="lg" value={75}>Large Progress</Progress>
      </div>
    </div>
  ),
}

export const LinearSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
      <div>
        <h3>Small Linear</h3>
        <Progress type="linear" size="sm" value={40}>Small Linear</Progress>
      </div>
      <div>
        <h3>Medium Linear</h3>
        <Progress type="linear" size="md" value={60}>Medium Linear</Progress>
      </div>
      <div>
        <h3>Large Linear</h3>
        <Progress type="linear" size="lg" value={80}>Large Linear</Progress>
      </div>
    </div>
  ),
}

export const CircularSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h3>Small</h3>
        <Progress type="circular" size="sm" value={30} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3>Medium</h3>
        <Progress type="circular" size="md" value={50} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3>Large</h3>
        <Progress type="circular" size="lg" value={70} />
      </div>
    </div>
  ),
}

export const ProgressValues: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <Progress value={0}>0% Complete</Progress>
      <Progress value={25}>25% Complete</Progress>
      <Progress value={50}>50% Complete</Progress>
      <Progress value={75}>75% Complete</Progress>
      <Progress value={100}>100% Complete</Progress>
    </div>
  ),
}

export const CircularValues: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circular" value={0} />
        <p>0%</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circular" value={25} />
        <p>25%</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circular" value={50} />
        <p>50%</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circular" value={75} />
        <p>75%</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circular" value={100} />
        <p>100%</p>
      </div>
    </div>
  ),
}

export const CustomRange: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <Progress value={5} min={0} max={10}>5 out of 10</Progress>
      <Progress value={750} min={0} max={1000}>750 out of 1000</Progress>
      <Progress value={3} min={1} max={5}>3 out of 5 stars</Progress>
    </div>
  ),
}

export const UploadProgress: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <Progress value={25}>Uploading file1.pdf...</Progress>
      <Progress value={60}>Uploading image.jpg...</Progress>
      <Progress value={90}>Uploading document.docx...</Progress>
      <Progress value={100}>Upload complete!</Progress>
    </div>
  ),
}

export const DownloadProgress: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <Progress value={15}>Downloading update...</Progress>
      <Progress value={45}>Downloading assets...</Progress>
      <Progress value={80}>Installing...</Progress>
      <Progress value={100}>Installation complete!</Progress>
    </div>
  ),
}

export const ProcessingStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <Progress value={20}>Processing data...</Progress>
      <Progress value={50}>Analyzing results...</Progress>
      <Progress value={85}>Generating report...</Progress>
      <Progress value={100}>Complete!</Progress>
    </div>
  ),
}

export const InteractiveProgress: Story = {
  render: () => {
    const [value, setValue] = useState(25)
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
        <Progress value={value}>{`${value}% Complete`}</Progress>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setValue(Math.max(0, value - 10))}>-10%</button>
          <button onClick={() => setValue(Math.min(100, value + 10))}>+10%</button>
          <button onClick={() => setValue(0)}>Reset</button>
          <button onClick={() => setValue(100)}>Complete</button>
        </div>
      </div>
    )
  },
}

export const InteractiveCircular: Story = {
  render: () => {
    const [value, setValue] = useState(30)
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <Progress type="circular" value={value} />
        <div style={{ textAlign: 'center' }}>
          <p>{value}% Complete</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={() => setValue(Math.max(0, value - 10))}>-10%</button>
            <button onClick={() => setValue(Math.min(100, value + 10))}>+10%</button>
            <button onClick={() => setValue(0)}>Reset</button>
            <button onClick={() => setValue(100)}>Complete</button>
          </div>
        </div>
      </div>
    )
  },
}

export const MixedTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px' }}>
      <div>
        <h3>Linear Progress</h3>
        <Progress type="linear" value={65}>File upload progress</Progress>
      </div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div>
          <h3>Circular Progress</h3>
          <Progress type="circular" value={65} />
        </div>
        <div>
          <h3>Linear Progress</h3>
          <Progress type="linear" value={65}>Processing</Progress>
        </div>
      </div>
    </div>
  ),
}

export const LoadingSimulation: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)
    
    // Simulate loading progress
    useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 500)
      
      return () => clearInterval(interval)
    }, [])
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
        <div>
          <h3>Linear Loading</h3>
          <Progress type="linear" value={progress}>{`Loading... ${Math.round(progress)}%`}</Progress>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3>Circular Loading</h3>
          <Progress type="circular" value={progress} />
          <p>{Math.round(progress)}%</p>
        </div>
      </div>
    )
  },
}

export const Accessibility: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <Progress 
        value={75} 
        aria-label="File upload progress"
      >
        Upload progress
      </Progress>
      <Progress 
        type="circular" 
        value={75} 
        aria-label="Circular progress indicator"
      />
      <Progress 
        value={50} 
        aria-describedby="progress-description"
      >
        Processing data
      </Progress>
      <div id="progress-description" style={{ fontSize: '0.875rem', color: '#666' }}>
        This shows the current processing status of your data
      </div>
    </div>
  ),
} 

export const IndeterminateLinear: Story = {
  args: {
    type: 'linear',
    value: null,
    children: 'Loading...',
  },
}

export const IndeterminateCircular: Story = {
  args: {
    type: 'circular',
    value: null,
    children: 'Loading...',
  },
}

export const IndeterminateSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
      <div>
        <h3>Small Indeterminate</h3>
        <Progress size="sm" value={null}>Small Loading</Progress>
      </div>
      <div>
        <h3>Medium Indeterminate</h3>
        <Progress size="md" value={null}>Medium Loading</Progress>
      </div>
      <div>
        <h3>Large Indeterminate</h3>
        <Progress size="lg" value={null}>Large Loading</Progress>
      </div>
    </div>
  ),
}

export const IndeterminateCircularSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h3>Small</h3>
        <Progress type="circular" size="sm" value={null} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3>Medium</h3>
        <Progress type="circular" size="md" value={null} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3>Large</h3>
        <Progress type="circular" size="lg" value={null} />
      </div>
    </div>
  ),
}

export const ProgressStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
      <div>
        <h3>Determinate Progress</h3>
        <Progress value={75}>75% Complete</Progress>
      </div>
      <div>
        <h3>Indeterminate Progress</h3>
        <Progress value={null}>Loading...</Progress>
      </div>
      <div>
        <h3>Determinate Circular</h3>
        <Progress type="circular" value={60}>60%</Progress>
      </div>
      <div>
        <h3>Indeterminate Circular</h3>
        <Progress type="circular" value={null}>Loading...</Progress>
      </div>
    </div>
  ),
} 
