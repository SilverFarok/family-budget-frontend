import Link from "next/link";

export default function Home() {
  return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
        <div className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Family Budget</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Додавай витрати й доходи, дивись підсумки за місяць і тримай бюджет під контролем.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
                href="/expenses"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Перейти до витрат
            </Link>

            <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-zinc-50"
            >
              Увійти
            </Link>
          </div>
        </div>
      </main>
  );
}
