export default function PlanetSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full px-5 py-5 max-[390px]:px-4 [&+&]:pt-0">
      <div className="mb-3 flex w-full items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-[0.95rem] font-extrabold text-(--gray-900)">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.75 text-[0.78rem] leading-[1.4] text-(--gray-600)">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
