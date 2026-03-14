import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { updateUserProfile } from "@/app/actions/user";
import { logout } from "@/app/actions/auth";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const saved = params.saved === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Назад
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Настройки профиля
          </h1>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Имя</p>
            <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {user.name}
            </p>
          </div>

          <form action={updateUserProfile} className="space-y-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Роль в команде
              </label>
              <select
                id="role"
                name="role"
                defaultValue={user.role ?? ""}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-blue-400"
              >
                <option value="">— Не выбрана —</option>
                <option value="DEV">Developer</option>
                <option value="QA">QA Engineer</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 transition-colors select-none hover:border-amber-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-amber-700">
              <input
                type="checkbox"
                name="isScrumMaster"
                defaultChecked={user.isScrumMaster}
                className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-600"
              />
              <div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Scrum Master</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Создание проектов и управление планированием</p>
              </div>
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Сохранить
            </button>
          </form>

          {saved && (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-400">
              Настройки обновлены
            </p>
          )}
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Выйти из аккаунта
          </button>
        </form>
      </div>
    </div>
  );
}
