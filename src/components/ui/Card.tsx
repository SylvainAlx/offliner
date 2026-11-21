import CardHeader from "./CardHeader";

interface CardProps {
  children: React.ReactNode;
  ariaLabel?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function Card({
  children,
  ariaLabel,
  title,
  subtitle,
  className = "",
}: CardProps) {
  return (
    <section
      className={`bg-(--bg) rounded-[20px] px-6 py-8 shadow-lg flex flex-col items-center gap-6 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <CardHeader title={title} subtitle={subtitle} />
      {children}
    </section>
  );
}
