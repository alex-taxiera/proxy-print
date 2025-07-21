import { useState, useEffect, useRef } from 'react';
import ProgressBar from '@ramonak/react-progress-bar';
import { progressEvents } from '../utils/progress-events';
import './ProgressOverlay.css';

export const ProgressOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleProgress = (data: { progress: number; phase: string } | void) => {
      if (data && typeof data === 'object' && 'progress' in data) {
        setProgress(data.progress);
        setPhase(data.phase);
        setIsVisible(true);
      }
    };

    const handleComplete = () => {
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        setPhase('');
      }, 1000);
    };

    progressEvents.on('progress', handleProgress);
    progressEvents.on('complete', handleComplete);

    return () => {
      progressEvents.off('progress', handleProgress);
      progressEvents.off('complete', handleComplete);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-content">
        <h3>Generating PDF</h3>
        <div className="progress-bar-container" ref={progressRef}>
          <ProgressBar 
            completed={progress}
            isIndeterminate={phase === 'Saving PDF'}
            isLabelVisible={false}
            bgColor="#00d4aa"
            height="8px"
            borderRadius="4px"
            labelAlignment="center"
            labelColor="#ffffff"
            labelSize="14px"
            className="custom-progress"
          />
          <div className="progress-text">
            {phase}
          </div>
        </div>
      </div>
    </div>
  );
}; 
