import CountUp from "react-countup";

interface StatProps {
  end: number;
  label: string;
}

export default function StatCounter({ end, label }: StatProps) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">
        <CountUp
          end={end}
          duration={5}
          enableScrollSpy
          scrollSpyOnce
          separator=","
        />
        +
      </div>
      <p className="text-sm  text-gray-500">{label}</p>
    </div>
  );
}
