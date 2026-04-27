import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export default function RolePlaceholder({
  title,
  description,
  accent,
}: {
  title: string;
  description: string;
  accent: string;
}) {
  const { signOut, user } = useAuth();
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
    >
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-tile"
        style={{ backgroundColor: accent }}
      >
        ر
      </div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{user?.email}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted"
        >
          المتجر
        </Link>
        <button
          onClick={() => signOut()}
          className="rounded-full bg-destructive/10 px-5 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
        >
          تسجيل الخروج
        </button>
      </div>
      <p className="mt-10 text-[11px] text-muted-foreground">
        هذه اللوحة قيد البناء — المرحلة 2 من خطة بناء النظام
      </p>
    </div>
  );
}