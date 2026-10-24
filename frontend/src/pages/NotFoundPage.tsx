import { Scissors } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { buttonClass } from "@/components/ui/Button";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="grid size-16 -rotate-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Scissors className="size-7" />
      </div>
      <p className="mt-8 font-display text-7xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold">{t("notFound.title")}</h1>
      <p className="mt-3 text-muted">{t("notFound.text")}</p>
      <Link to="/" className={buttonClass("primary", "lg", "mt-8")}>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
