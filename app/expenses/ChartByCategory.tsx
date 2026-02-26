"use client";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Tooltip,
    Legend,
    Cell,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
    Продукти: "#8e2e9e",
    Транспорт: "#0c38ca",
    Дім: "#dcc21a",
    "Здоров'я": "#a6360e",
    Інше: "#7c3aed",
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
                    {data.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[data[index].name] ?? "#94a3b8"}
                        />
                    ))}
                </Pie>

                <Tooltip formatter={(value) => [`₴ ${value}`, "Сума"]} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
