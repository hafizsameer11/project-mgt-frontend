import React, { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from './ui/Button';
import { taskService } from '../services/taskService';

interface TaskTimerProps {
  taskId: number;
  timerId?: number;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ taskId, timerId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentTimerId, setCurrentTimerId] = useState<number | undefined>(timerId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      const timer = await taskService.startTimer(taskId);
      setCurrentTimerId(timer.id);
      setIsRunning(true);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = async () => {
    if (currentTimerId) {
      try {
        await taskService.stopTimer(currentTimerId);
        setIsRunning(false);
        setSeconds(0);
      } catch (error) {
        console.error('Error stopping timer:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-2xl font-mono font-bold">{formatTime(seconds)}</div>
      <div className="flex gap-2">
        {!isRunning ? (
          <Button size="sm" onClick={handleStart}>
            <Play className="w-4 h-4 mr-1" />
            Start
          </Button>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={() => setIsRunning(false)}>
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
            <Button size="sm" variant="danger" onClick={handleStop}>
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

