"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChartByCategory from "./ChartByCategory";

type Expense = {
    id: string;
    title: string;
    amount: number;
    createdAt: string;
    category: string;
};

type PayloadExpenseDoc = {
    id: string | number;
    title?: string;
    amount?: number;
    category?: string;
    createdAt?: string;
};

type PayloadExpenseListResponse = {
    docs?: PayloadExpenseDoc[];
};

type ConnectedUser = {
    id: string;
    email: string;
};

type ConnectionsResponse = {
    connections?: ConnectedUser[];
    currentUserEmail?: string | null;
    error?: string;
};

type InviteResponse = {
    inviteUrl?: string;
    token?: string;
    expiresAt?: string;
    error?: string;
};

type AcceptInviteResponse = {
    message?: string;
    error?: string;
};

const CATEGORIES = ["Продукти", "Транспорт", "Дім", "Здоров'я", "Інше"] as const;

const extractInviteToken = (rawValue: string): string => {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";

    try {
        const url = new URL(trimmed);
        return url.searchParams.get("invite")?.trim() ?? "";
    } catch {
        const match = trimmed.match(/[?&]invite=([^&]+)/);
        if (!match) return trimmed;

        try {
            return decodeURIComponent(match[1]);
        } catch {
            return match[1];
        }
    }
};

export default function ExpensesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Продукти");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editCategory, setEditCategory] = useState<(typeof CATEGORIES)[number]>("Продукти");

    const [isReady, setIsReady] = useState(false);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteToken, setInviteToken] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [inviteExpiresAt, setInviteExpiresAt] = useState("");
    const [connections, setConnections] = useState<ConnectedUser[]>([]);
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const [connectionError, setConnectionError] = useState("");
    const [connectionMessage, setConnectionMessage] = useState("");

    const loadExpenses = useCallback(async () => {
        const res = await fetch("/api/expenses?limit=100&sort=-createdAt", {
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Expenses API error: ${res.status}`);
        }

        const data = (await res.json()) as PayloadExpenseListResponse;
        const docs = data.docs ?? [];

        const mapped: Expense[] = docs.map((doc) => ({
            id: String(doc.id),
            title: doc.title ?? "",
            amount: Number(doc.amount ?? 0),
            category: (doc.category ?? "Інше") as (typeof CATEGORIES)[number],
            createdAt: doc.createdAt ?? new Date().toISOString(),
        }));

        setExpenses(mapped);
    }, []);

    const loadConnections = useCallback(async () => {
        const res = await fetch("/api/users/connections", { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`Connections API error: ${res.status}`);
        }

        const data = (await res.json()) as ConnectionsResponse;
        setConnections(data.connections ?? []);
        setCurrentUserEmail(data.currentUserEmail ?? "");
    }, []);

    useEffect(() => {
        const inviteFromUrl = searchParams.get("invite") ?? "";
        if (inviteFromUrl) {
            setInviteToken(inviteFromUrl);
            setConnectionMessage("Знайдено токен із посилання. Натисни 'Прийняти запрошення'.");
        }
    }, [searchParams]);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const meRes = await fetch("/api/auth/me", { cache: "no-store" });
                if (!meRes.ok) {
                    router.replace("/login");
                    return;
                }

                await Promise.all([loadExpenses(), loadConnections()]);
                setIsReady(true);
            } catch (error) {
                console.error(error);
                setConnectionError("Не вдалося завантажити дані. Спробуй оновити сторінку.");
                setIsReady(true);
            }
        };

        bootstrap();
    }, [loadConnections, loadExpenses, router]);

    const addExpense = async () => {
        const cleanTitle = title.trim();
        const cleanAmount = Number(amount);

        if (!cleanTitle) return;
        if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) return;

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: cleanTitle,
                    amount: cleanAmount,
                    category,
                }),
            });

            if (!res.ok) throw new Error(`POST failed: ${res.status}`);

            const created = (await res.json()) as PayloadExpenseDoc;

            const mapped: Expense = {
                id: String(created.id),
                title: created.title ?? cleanTitle,
                amount: Number(created.amount ?? cleanAmount),
                category: (created.category ?? category) as (typeof CATEGORIES)[number],
                createdAt: created.createdAt ?? new Date().toISOString(),
            };

            setExpenses((prev) => [mapped, ...prev]);
            setTitle("");
            setAmount("");
        } catch (error) {
            console.error(error);
        }
    };

    const removeExpense = async (id: string) => {
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);

            setExpenses((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setEditTitle(expense.title);
        setEditAmount(String(expense.amount));
        setEditCategory(expense.category as (typeof CATEGORIES)[number]);
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

            const updated = (await res.json()) as PayloadExpenseDoc;

            setExpenses((prev) =>
                prev.map((item) =>
                    item.id === editingId
                        ? {
                              ...item,
                              title: updated.title ?? cleanTitle,
                              amount: Number(updated.amount ?? cleanAmount),
                              category:
                                  (updated.category ?? editCategory) as (typeof CATEGORIES)[number],
                          }
                        : item
                )
            );

            cancelEdit();
        } catch (error) {
            console.error(error);
        }
    };

    const createInvite = async () => {
        setConnectionError("");
        setConnectionMessage("");
        setInviteLink("");
        setInviteExpiresAt("");

        const email = inviteEmail.trim().toLowerCase();
        if (!email) {
            setConnectionError("Вкажи email для запрошення.");
            return;
        }

        try {
            const res = await fetch("/api/users/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = (await res.json()) as InviteResponse;
            if (!res.ok) {
                setConnectionError(data.error ?? "Не вдалося створити запрошення.");
                return;
            }

            setInviteLink(data.inviteUrl ?? "");
            setInviteToken(data.token ?? "");
            setInviteExpiresAt(data.expiresAt ?? "");
            setConnectionMessage("Запрошення згенеровано.");
        } catch (error) {
            console.error(error);
            setConnectionError("Помилка під час створення запрошення.");
        }
    };

    const acceptInvite = async () => {
        setConnectionError("");
        setConnectionMessage("");

        const token = extractInviteToken(inviteToken);
        if (!token) {
            setConnectionError("Встав токен запрошення.");
            return;
        }

        try {
            const res = await fetch("/api/users/accept-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = (await res.json()) as AcceptInviteResponse;
            if (!res.ok) {
                setConnectionError(data.error ?? "Не вдалося прийняти запрошення.");
                return;
            }

            setConnectionMessage(data.message ?? "Запрошення прийнято.");
            setInviteToken("");
            await Promise.all([loadConnections(), loadExpenses()]);
        } catch (error) {
            console.error(error);
            setConnectionError("Помилка під час прийняття запрошення.");
        }
    };

    const total = useMemo(
        () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
        [expenses]
    );

    const totalsByCategory = useMemo(() => {
        return expenses.reduce<Record<string, number>>((acc, expense) => {
            acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
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
        return expenses.filter((expense) => expense.category === categoryFilter);
    }, [expenses, categoryFilter]);

    if (!isReady) {
        return (
            <main className="min-h-screen bg-zinc-50 p-6">
                <div className="mx-auto w-full max-w-5xl rounded-2xl border bg-white p-4 text-sm text-zinc-600">
                    Завантаження...
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto w-full max-w-5xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Витрати</h1>
                        <p className="mt-1 text-sm text-zinc-600">
                            Додай витрату і одразу побачиш підсумок.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-white px-4 py-2">
                        <div className="text-xs text-zinc-500">Всього</div>
                        <div className="text-lg font-semibold">₴ {total}</div>
                    </div>
                </header>

                <section className="rounded-2xl border bg-white p-4 space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Підключені користувачі</h2>
                            <p className="text-sm text-zinc-600">
                                Поточний користувач: {currentUserEmail || "невідомо"}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Запросити по email</label>
                            <div className="flex gap-2">
                                <input
                                    className="h-10 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(event) => setInviteEmail(event.target.value)}
                                />
                                <button
                                    className="h-10 shrink-0 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"
                                    onClick={createInvite}
                                >
                                    Створити
                                </button>
                            </div>

                            {inviteLink && (
                                <div className="rounded-xl border bg-zinc-50 p-3 text-xs">
                                    <div className="mb-1 text-zinc-600">Посилання запрошення:</div>
                                    <div className="break-all">{inviteLink}</div>
                                    {inviteExpiresAt && (
                                        <div className="mt-2 text-zinc-500">
                                            Діє до: {new Date(inviteExpiresAt).toLocaleString("uk-UA")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Прийняти запрошення</label>
                            <textarea
                                className="min-h-24 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                placeholder="Встав токен або повне посилання з параметром invite"
                                value={inviteToken}
                                onChange={(event) => setInviteToken(event.target.value)}
                            />
                            <button
                                className="h-10 rounded-xl border px-4 text-sm hover:bg-zinc-50"
                                onClick={acceptInvite}
                            >
                                Прийняти запрошення
                            </button>
                        </div>
                    </div>

                    {connectionError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {connectionError}
                        </div>
                    )}

                    {connectionMessage && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            {connectionMessage}
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold">Підключені email</h3>
                        {connections.length === 0 ? (
                            <p className="mt-2 text-sm text-zinc-600">Ще немає підключених користувачів.</p>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {connections.map((item) => (
                                    <li
                                        key={item.id}
                                        className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm"
                                    >
                                        {item.email}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-zinc-600">Фільтр:</span>

                        <select
                            className="h-9 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                        >
                            <option value="all">Всі категорії</option>
                            {CATEGORIES.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <section className="mb-4 rounded-2xl border bg-white p-4">
                            <div className="flex flex-col gap-3">
                                <input
                                    className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    placeholder="Опис (наприклад: Сільпо, вечеря)"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") addExpense();
                                    }}
                                />

                                <select
                                    className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(event.target.value as (typeof CATEGORIES)[number])
                                    }
                                >
                                    {CATEGORIES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="Сума"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") addExpense();
                                    }}
                                />

                                <button
                                    className="h-11 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"
                                    onClick={addExpense}
                                >
                                    Додати
                                </button>
                            </div>

                            <p className="mt-3 text-xs text-zinc-500">Порада: Enter теж додає витрату.</p>
                        </section>

                        <section className="rounded-2xl border bg-white">
                            {expenses.length === 0 ? (
                                <div className="p-6 text-sm text-zinc-600">Поки що порожньо.</div>
                            ) : (
                                <ul className="divide-y">
                                    {filteredExpenses.map((expense) => (
                                        <li
                                            key={expense.id}
                                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            {editingId === expense.id ? (
                                                <>
                                                    <div className="flex flex-wrap gap-2">
                                                        <input
                                                            className="h-10 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                                            value={editTitle}
                                                            onChange={(event) =>
                                                                setEditTitle(event.target.value)
                                                            }
                                                            placeholder="Опис"
                                                        />

                                                        <select
                                                            className="h-10 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                                            value={editCategory}
                                                            onChange={(event) =>
                                                                setEditCategory(
                                                                    event.target.value as (typeof CATEGORIES)[number]
                                                                )
                                                            }
                                                        >
                                                            {CATEGORIES.map((item) => (
                                                                <option key={item} value={item}>
                                                                    {item}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <input
                                                            className="h-10 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-black/10"
                                                            type="number"
                                                            value={editAmount}
                                                            onChange={(event) =>
                                                                setEditAmount(event.target.value)
                                                            }
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
                                                <>
                                                    <div>
                                                        <div className="font-medium">
                                                            {expense.category}: {expense.title}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">
                                                            Час:{" "}
                                                            {new Date(expense.createdAt).toLocaleString("uk-UA")}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold">₴ {expense.amount}</div>

                                                        <button
                                                            className="h-9 rounded-lg border px-3 text-sm hover:bg-zinc-50"
                                                            onClick={() => startEdit(expense)}
                                                        >
                                                            Редагувати
                                                        </button>

                                                        <button
                                                            className="h-9 rounded-lg border px-3 text-sm hover:bg-zinc-50"
                                                            onClick={() => removeExpense(expense.id)}
                                                        >
                                                            Видалити
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

                    <section className="rounded-2xl border bg-white p-4">
                        <h2 className="text-sm font-semibold">Графік по категоріях</h2>
                        <div className="mt-4 h-72 w-full">
                            <ChartByCategory data={chartData} />
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
