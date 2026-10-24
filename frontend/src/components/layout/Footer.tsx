import { MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShop } from "@/api/queries";
import { Logo } from "./Logo";

export function Footer() {
  const { t } = useTranslation();
  const { data: shop } = useShop();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <Logo />
        <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:gap-6">
          {shop?.address && (
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> {shop.address}
            </span>
          )}
          {shop?.phone && (
            <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-fg">
              <Phone className="size-4" /> {shop.phone}
            </a>
          )}
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {shop?.name ?? "Barber"}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
