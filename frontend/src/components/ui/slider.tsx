import React from "react";
import { cn } from "../../lib/utils";

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  onPointerDown?: () => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value = [0],
  onValueChange,
  onValueCommit,
  onPointerDown,
  max = 100,
  min = 0,
  step = 1,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = [parseFloat(e.target.value)];
    onValueChange?.(newValue);
  };

  const handleMouseUp = () => {
    onValueCommit?.(value);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      onMouseDown={onPointerDown}
      onMouseUp={handleMouseUp}
      className={cn(
        "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider",
        className,
      )}
    />
  );
};
