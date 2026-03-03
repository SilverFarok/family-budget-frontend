"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RegisterResponse = {
    errors?: Array<{ message?: string }>;
    message?: string;
};

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        setError("");

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setError("Вкажи email.");
            return;
        }

        if (password.length < 6) {
            setError("Пароль має містити щонайменше 6 символів.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Паролі не співпадають.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: trimmedEmail,
                    password,
                }),
            });

            const data = (await res.json().catch(() => null)) as RegisterResponse | null;
            if (!res.ok) {
                const apiError = data?.errors?.[0]?.message ?? data?.message;
                setError(apiError ?? "Не вдалося створити акаунт.");
                return;
            }

            router.push("/login");
        } catch (requestError) {
            console.error(requestError);
            setError("Помилка під час реєстрації.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-sm rounded-2xl border bg-white p-6 space-y-4">
                <h1 className="text-xl font-semibold">Реєстрація</h1>

                <input
                    className="h-11 w-full rounded-xl border px-3"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                />

                <input
                    className="h-11 w-full rounded-xl border px-3"
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                />

                <input
                    className="h-11 w-full rounded-xl border px-3"
                    type="password"
                    placeholder="Повтори пароль"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                />

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                    className="h-11 w-full rounded-xl bg-black text-white disabled:opacity-60"
                    onClick={submit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Створення..." : "Створити акаунт"}
                </button>

                <p className="text-sm text-zinc-600">
                    Вже є акаунт?{" "}
                    <Link href="/login" className="underline">
                        Увійти
                    </Link>
                </p>
            </div>
        </main>
    );
}
