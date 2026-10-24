import { useTranslation } from "react-i18next";
import type { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<AppointmentStatus, string> = {
  Booked: "bg-accent-soft text-accent",
  Completed: "bg-success-soft text-success",
  Cancelled: "bg-surface-2 text-muted line-through decoration-1",
  NoShow: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>
      {t(`status.${status}`)}
    </span>
  );
}
