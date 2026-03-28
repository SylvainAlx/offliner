import { formatDuration } from "shared/utils/formatDuration";

import useAnimatedColor from "@/hooks/useAnimatedColor";

import DigitDisplay from "./DigitDisplay";

interface TimerProps {
  label: string;
  duration: number;
}

export default function Timer({ label, duration }: TimerProps) {
  const { animatedColor } = useAnimatedColor();

  return (
    <DigitDisplay
      digit={formatDuration(duration)}
      label={label}
      color={animatedColor}
    />
  );
}
