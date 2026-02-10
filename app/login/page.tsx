"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const submit = async () => {
        setError("");

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            setError("Невірний email або пароль");
            return;
        }

        router.push("/expenses");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="w-full max-w-sm rounded-2xl border bg-white p-6 space-y-4">
                <h1 className="text-xl font-semibold">Вхід</h1>

                <input
                    className="h-11 w-full rounded-xl border px-3"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="h-11 w-full rounded-xl border px-3"
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                    className="h-11 w-full rounded-xl bg-black text-white"
                    onClick={submit}
                >
                    Увійти
                </button>
            </div>
        </main>
    );
}
