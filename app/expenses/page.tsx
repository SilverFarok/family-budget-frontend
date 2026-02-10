"use client";

import { useMemo, useState, useEffect } from "react";
import ChartByCategory from "./ChartByCategory";

type Expense = {
    id: string;
    title: string;
    amount: number;
    createdAt: string;
    category: string;
};
const CATEGORIES = ["Продукти", "Транспорт", "Дім", "Здоров'я", "Інше"] as const;
const API_BASE = "http://localhost:3001";
export default function ExpensesPage() {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Продукти");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editCategory, setEditCategory] =
        useState<(typeof CATEGORIES)[number]>("Продукти");

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/expenses?limit=100&sort=-createdAt");


                if (!res.ok) throw new Error(`API error: ${res.status}`);

                const data = await res.json();

                const docs = (data?.docs ?? []) as any[];

                const mapped: Expense[] = docs.map((d) => ({
                    id: String(d.id),
                    title: d.title ?? "",
                    amount: Number(d.amount ?? 0),
                    category: (d.category ?? "Інше") as (typeof CATEGORIES)[number],
                    createdAt: d.createdAt ?? new Date().toISOString(),
                }));

                setExpenses(mapped);
            } catch (e) {
                console.error(e);
            }
        };

        load();
    }, []);

    const addExpense = async () => {
        const cleanTitle = title.trim();
        const cleanAmount = Number(amount);

        if (!cleanTitle) return;
        if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) return;

        try {
            const res = await fetch(`/api/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: cleanTitle,
                    amount: cleanAmount,
                    category,
                }),
            });

            if (!res.ok) throw new Error(`POST failed: ${res.status}`);

            const created = await res.json();

            const mapped: Expense = {
                id: String(created.id),
                title: created.title ?? cleanTitle,
                amount: Number(created.amount ?? cleanAmount),
                category: created.category ?? category,
                createdAt: created.createdAt ?? new Date().toISOString(),
            };

            setExpenses((prev) => [mapped, ...prev]);
            setTitle("");
            setAmount("");
        } catch (e) {
            console.error(e);
        }
    };

    const removeExpense = async (id: string) => {
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);

            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const startEdit = (e: Expense) => {
        setEditingId(e.id);
        setEditTitle(e.title);
        setEditAmount(String(e.amount));
        setEditCategory(e.category as (typeof CATEGORIES)[number]);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle("");
        setEditAmount("");
        setEditCategory("Продукти");
    };

    const saveEdit = async () => {
        if (!editingId) return;

        const cleanTitle = editTitle.trim();
        const cleanAmount = Number(editAmount);

        if (!cleanTitle) return;
        if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) return;

        try {
            const res = await fetch(`/api/expenses/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: cleanTitle,
                    amount: cleanAmount,
                    category: editCategory,
                }),
            });

            if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);

            const updated = await res.json();

            setExpenses((prev) =>
                prev.map((item) =>
                    item.id === editingId
                        ? {
                            ...item,
                            title: updated.title ?? cleanTitle,
                            amount: Number(updated.amount ?? cleanAmount),
                            category: updated.category ?? editCategory,
                        }
                        : item
                )
            );

            cancelEdit();
        } catch (e) {
            console.error(e);
        }
    };


    const total = useMemo(
        () => expenses.reduce((sum, e) => sum + e.amount, 0),
        [expenses]
    );
    const totalsByCategory = useMemo(() => {
        return expenses.reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] ?? 0) + e.amount;
            return acc;
        }, {});
    }, [expenses]);

    const chartData = useMemo(() => {
        return Object.entries(totalsByCategory).map(([name, value]) => ({
            name,
            value,
        }));
    }, [totalsByCategory]);

    const filteredExpenses = useMemo(() => {
        if (categoryFilter === "all") return expenses;
        return expenses.filter((e) => e.category === categoryFilter);
    }, [expenses, categoryFilter]);

    return (
        <main className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <header className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Витрати</h1>
                        <p className="mt-1 text-sm text-zinc-600">
                            Додай витрату — і одразу побачиш підсумок.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-white px-4 py-2">
                        <div className="text-xs text-zinc-500">Всього</div>
                        <div className="text-lg font-semibold">₴ {total}</div>
                    </div>
                </header>
                <section className="rounded-2xl border bg-white p-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-zinc-600">Фільтр:</span>

                        <select
                            className="h-9 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">Всі категорії</option>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>
                <div className="flex gap-4">
                    <div className="box w-1/2">
                        {/* Форма */}
                        <section className="rounded-2xl border bg-white p-4 mb-4">
                            <div className="flex flex-col gap-3">
                                <input
                                    className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    placeholder="Опис (напр. Сільпо, вечеря)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addExpense();
                                    }}
                                />

                                <select
                                    className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="Сума"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addExpense();
                                    }}
                                />


                                <button
                                    className="h-11 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800 col-span-full cursor-pointer"
                                    onClick={addExpense}
                                >
                                    Додати
                                </button>
                            </div>

                            <p className="mt-3 text-xs text-zinc-500">
                                Порада: Enter теж додає витрату (бо ми не любимо зайві рухи).
                            </p>
                        </section>

                        {/* Список */}
                        <section className="rounded-2xl border bg-white ">

                            {expenses.length === 0 ? (
                                <div className="p-6 text-sm text-zinc-600">Поки що порожньо.</div>
                            ) : (
                                <ul className="divide-y">
                                    {filteredExpenses.map((e) => (
                                        <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
                                            {editingId === e.id ? (
                                                // ✅ РЕЖИМ РЕДАГУВАННЯ
                                                <>
                                                    <div className="flex flex-wrap gap-4">
                                                        <input
                                                            className="h-10 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                                            value={editTitle}
                                                            onChange={(ev) => setEditTitle(ev.target.value)}
                                                            placeholder="Опис"
                                                        />

                                                        <select
                                                            className="h-10 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                                            value={editCategory}
                                                            onChange={(ev) =>
                                                                setEditCategory(ev.target.value as (typeof CATEGORIES)[number])
                                                            }
                                                        >
                                                            {CATEGORIES.map((c) => (
                                                                <option key={c} value={c}>
                                                                    {c}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <input
                                                            className="h-10 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                                            type="number"
                                                            value={editAmount}
                                                            onChange={(ev) => setEditAmount(ev.target.value)}
                                                            placeholder="Сума"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="h-10 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"
                                                            onClick={saveEdit}
                                                        >
                                                            Зберегти
                                                        </button>

                                                        <button
                                                            className="h-10 rounded-xl border px-4 text-sm hover:bg-zinc-50"
                                                            onClick={cancelEdit}
                                                        >
                                                            Скасувати
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                // ✅ РЕЖИМ ПЕРЕГЛЯДУ
                                                <>
                                                    <div>
                                                        <div className="font-medium">
                                                            {e.category}: {e.title}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">
                                                            Час: {new Date(e.createdAt).toLocaleString("uk-UA")}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="font-semibold">₴ {e.amount}</div>

                                                        <button
                                                            className="h-9 rounded-lg border px-3 text-sm hover:bg-zinc-50"
                                                            onClick={() => startEdit(e)}
                                                            title="Редагувати"
                                                        >
                                                            Редагувати
                                                        </button>

                                                        <button
                                                            className="h-9 rounded-lg border px-3 text-sm hover:bg-zinc-50"
                                                            onClick={() => removeExpense(e.id)}
                                                            title="Видалити"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </li>

                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                    <div className="chart w-1/2 h-full">
                        <div className="rounded-2xl border bg-white p-4 mb-4">
                            <h2 className="text-sm font-semibold">Графік по категоріях</h2>

                            <div className="mt-4 h-72 w-full">
                                <ChartByCategory data={chartData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
