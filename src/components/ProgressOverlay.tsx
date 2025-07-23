import { useState, useEffect, useRef } from 'react';
import ProgressBar from '@ramonak/react-progress-bar';
import { progressEvents } from '../utils/progress-events';
import './ProgressOverlay.css';

export const ProgressOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalProgressAmount, setTotalProgressAmount] = useState(100);
  const [phase, setPhase] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleProgress = (data: { progress: number; totalProgressAmount?: number; phase?: string; isIndeterminate?: boolean } | void) => {
      if (data && typeof data === 'object' && 'progress' in data) {
        setProgress(data.progress);
        if (data.totalProgressAmount) {
          setTotalProgressAmount(data.totalProgressAmount);
        }
        if (data.phase) {
          setPhase(data.phase);
        }
        if (data.isIndeterminate) {
          setIsIndeterminate(true);
        }
        setIsVisible(true);
      }
    };

    const handleComplete = () => {
      setTimeout(() => {
        setIsVisible(false);
        setIsIndeterminate(false);
        setTotalProgressAmount(100);
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
            maxCompleted={totalProgressAmount}
            isIndeterminate={isIndeterminate}
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
