import CountUp from "react-countup";

interface StatProps {
  end: number;
  label: string;
  /** Use on dark hero surfaces */
  light?: boolean;
}

export default function StatCounter({ end, label, light = false }: StatProps) {
  return (
    <div className="text-center">
      <div
        className={`font-display text-3xl font-light tracking-tight ${
          light ? "text-white" : "text-gray-900"
        }`}
      >
        <CountUp
          end={end}
          duration={5}
          enableScrollSpy
          scrollSpyOnce
          separator=","
        />
        +
      </div>
      <p
        className={`mt-1 text-xs uppercase tracking-[0.18em] ${
          light ? "text-white/70" : "text-gray-500"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
