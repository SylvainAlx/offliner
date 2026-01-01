import { formatDuration } from "shared/utils/formatDuration";
import DigitDisplay from "./DigitDisplay";
import useAnimatedColor from "@/hooks/useAnimatedColor";

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
