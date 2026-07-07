'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendPoint } from '../types';

interface TrendChartProps {
  classicTrend: TrendPoint[];
  aiTrend: TrendPoint[];
}

export default function TrendChart({ classicTrend, aiTrend }: TrendChartProps) {
  const chartData = useMemo(() => {
    const allHours = new Set([
      ...classicTrend.map((p) => p.hour),
      ...aiTrend.map((p) => p.hour),
    ]);

    return Array.from(allHours)
      .sort((a, b) => a - b)
      .map((hour) => {
        const classic = classicTrend.find((p) => p.hour === hour);
        const ai = aiTrend.find((p) => p.hour === hour);
        return {
          hour,
          label: formatTrendLabel(hour),
          central: classic?.central,
          upper: classic?.upper,
          lower: classic?.lower,
          aiCentral: ai?.central,
          aiUpper: ai?.upper,
          aiLower: ai?.lower,
        };
      });
  }, [classicTrend, aiTrend]);

  if (chartData.length === 0) return null;

  return (
    <div className="h-52 w-full rounded-lg bg-slate-800/40 border border-slate-700/30 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="trendNWP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="40%" stopColor="#a78bfa" stopOpacity={0.1} />
              <stop offset="60%" stopColor="#a78bfa" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="trendAI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#34d399" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval={23}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={(v) => `${v}°`}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            formatter={(value: number, name: string) => {
              if (name === 'upper' || name === 'lower' || name === 'aiUpper' || name === 'aiLower') {
                return [null, null];
              }
              const labels: Record<string, string> = {
                central: '🟣 NWP Central',
                aiCentral: '🟢 IA Central',
              };
              return [`${value?.toFixed(1)}°C`, labels[name] || name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            iconSize={8}
          />

          {/* Classic NWP confidence band */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#trendNWP)"
            fillOpacity={1}
            name="NWP ±σ"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#0f172a"
            fillOpacity={0.9}
            name=" "
            legendType="none"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="central"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            name="NWP Central"
            isAnimationActive={false}
          />

          {/* AI confidence band + line */}
          {aiTrend.length > 0 && (
            <>
              <Area
                type="monotone"
                dataKey="aiUpper"
                stroke="none"
                fill="url(#trendAI)"
                fillOpacity={1}
                legendType="none"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="aiLower"
                stroke="none"
                fill="#0f172a"
                fillOpacity={0.85}
                legendType="none"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="aiCentral"
                stroke="#34d399"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                name="IA Central"
                isAnimationActive={false}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTrendLabel(hour: number): string {
  const day = Math.floor(hour / 24) + 1;
  const h = hour % 24;
  if (h === 0) return `J${day}`;
  return '';
}
