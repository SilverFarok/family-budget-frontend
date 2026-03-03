"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
    Продукти: "#ef4444",
    Транспорт: "#3b82f6",
    Дім: "#22c55e",
    "Здоров'я": "#f97316",
    Інше: "#6b7280",
};

export default function ChartByCategory({
    data,
}: {
    data: { name: string; value: number }[];
}) {
    if (!data.length) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                Немає даних для графіка
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    isAnimationActive
                    animationDuration={400}
                    animationEasing="ease-out"
                    outerRadius={90}
                >
                    {data.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[item.name] ?? "#94a3b8"} />
                    ))}
                </Pie>

                <Tooltip formatter={(value) => [`₴ ${value}`, "Сума"]} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
