import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { keys, useShop } from "@/api/queries";
import { currentLanguage } from "@/i18n";
import { tokenStore } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Appointment } from "@/lib/types";

export type LiveStatus = "connecting" | "connected" | "offline";

function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
  }
}

export function useBarberNotifications(): LiveStatus {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: shop } = useShop();
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const timeZone = shop?.timeZone ?? "Europe/Tirane";

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL ?? ""}/hubs/notifications`, { accessTokenFactory: () => tokenStore.get() ?? "" })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const describe = (a: Appointment) => {
      const lang = currentLanguage();
      const service = lang === "en" ? a.serviceNameEn : a.serviceNameSq;
      const when = formatDateTime(a.startTime, lang, timeZone, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
      return `${a.clientName} · ${service} · ${when}`;
    };

    const refresh = () => queryClient.invalidateQueries({ queryKey: keys.admin.all });

    connection.on("appointmentBooked", (a: Appointment) => {
      chime();
      toast.success(t("admin.live.newBooking"), { description: describe(a), duration: 8000 });
      refresh();
    });
    connection.on("appointmentCancelled", (a: Appointment) => {
      toast.warning(t("admin.live.cancelledBooking"), { description: describe(a), duration: 8000 });
      refresh();
    });

    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => {
      setStatus("connected");
      refresh();
    });
    connection.onclose(() => setStatus("offline"));

    let cancelled = false;
    connection
      .start()
      .then(() => !cancelled && setStatus("connected"))
      .catch(() => !cancelled && setStatus("offline"));

    return () => {
      cancelled = true;
      if (connection.state !== HubConnectionState.Disconnected) connection.stop();
    };
  }, [queryClient, t, timeZone]);

  return status;
}
