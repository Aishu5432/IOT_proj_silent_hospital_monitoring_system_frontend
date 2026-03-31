import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

const ChartComponent = ({
  type = "line",
  data = [],
  dataKey,
  xKey = "label",
  label,
  color = "#3b82f6",
  threshold,
  height = 300,
}) => {
  if (!dataKey) return null;

  const sharedProps = {
    data,
    margin: { top: 16, right: 24, left: 0, bottom: 8 },
  };

  const commonChildren = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      {typeof threshold === "number" && (
        <ReferenceLine
          y={threshold}
          stroke="#ef4444"
          strokeDasharray="5 5"
          label={{
            value: `Threshold ${threshold}`,
            fill: "#ef4444",
            position: "insideTopRight",
          }}
        />
      )}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "bar" ? (
        <BarChart {...sharedProps}>
          {commonChildren}
          <Bar dataKey={dataKey} fill={color} name={label} />
        </BarChart>
      ) : type === "area" ? (
        <AreaChart {...sharedProps}>
          {commonChildren}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            name={label}
          />
        </AreaChart>
      ) : (
        <LineChart {...sharedProps}>
          {commonChildren}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={label}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

export default ChartComponent;
