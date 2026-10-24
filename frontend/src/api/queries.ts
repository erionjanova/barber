import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Appointment,
  AppointmentStatus,
  DashboardStats,
  DayAvailability,
  Language,
  Service,
  ShopInfo,
  TimeOff,
  UpsertService,
  User,
  WorkingHours,
} from "@/lib/types";

export const keys = {
  shop: ["shop"] as const,
  services: ["services"] as const,
  availability: (date: string, serviceId: string) => ["availability", date, serviceId] as const,
  myAppointments: ["appointments", "mine"] as const,
  admin: {
    all: ["admin"] as const,
    dashboard: ["admin", "dashboard"] as const,
    appointments: (filter: AdminAppointmentFilter) => ["admin", "appointments", filter] as const,
    services: ["admin", "services"] as const,
    workingHours: ["admin", "working-hours"] as const,
    timeOff: ["admin", "time-off"] as const,
  },
};

export const useShop = () =>
  useQuery({ queryKey: keys.shop, queryFn: () => api.get<ShopInfo>("/api/shop"), staleTime: 5 * 60_000 });

export const useServices = () =>
  useQuery({ queryKey: keys.services, queryFn: () => api.get<Service[]>("/api/services"), staleTime: 5 * 60_000 });

export const useAvailability = (date: string | null, serviceId: string | null) =>
  useQuery({
    queryKey: keys.availability(date ?? "", serviceId ?? ""),
    queryFn: () => api.get<DayAvailability>(`/api/availability?date=${date}&serviceId=${serviceId}`),
    enabled: !!date && !!serviceId,
    staleTime: 15_000,
  });

export interface BookInput {
  serviceId: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
}

export const useMyAppointments = () =>
  useQuery({ queryKey: keys.myAppointments, queryFn: () => api.get<Appointment[]>("/api/appointments") });

export const useBookAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookInput) => api.post<Appointment>("/api/appointments", input),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: keys.myAppointments });
    },
  });
};

export const useCancelMyAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Appointment>(`/api/appointments/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.myAppointments });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
};

export interface ProfileInput {
  fullName: string;
  phoneNumber: string;
  preferredLanguage: Language;
}

export const useUpdateProfile = () =>
  useMutation({ mutationFn: (input: ProfileInput) => api.put<User>("/api/auth/me", input) });

export interface AdminAppointmentFilter {
  from: string;
  to: string;
  status?: AppointmentStatus;
  search?: string;
}

export const useDashboard = () =>
  useQuery({ queryKey: keys.admin.dashboard, queryFn: () => api.get<DashboardStats>("/api/admin/dashboard") });

export const useAdminAppointments = (filter: AdminAppointmentFilter) =>
  useQuery({
    queryKey: keys.admin.appointments(filter),
    queryFn: () => {
      const params = new URLSearchParams({ from: filter.from, to: filter.to });
      if (filter.status) params.set("status", filter.status);
      if (filter.search) params.set("search", filter.search);
      return api.get<Appointment[]>(`/api/admin/appointments?${params}`);
    },
    placeholderData: (previous) => previous,
  });

export const useUpdateAppointmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch<Appointment>(`/api/admin/appointments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.admin.all }),
  });
};

export const useAdminServices = () =>
  useQuery({ queryKey: keys.admin.services, queryFn: () => api.get<Service[]>("/api/admin/services") });

export const useSaveService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: UpsertService }) =>
      id ? api.put<Service>(`/api/admin/services/${id}`, data) : api.post<Service>("/api/admin/services", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.admin.services });
      qc.invalidateQueries({ queryKey: keys.services });
    },
  });
};

export const useDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.admin.services });
      qc.invalidateQueries({ queryKey: keys.services });
    },
  });
};

export const useWorkingHours = () =>
  useQuery({ queryKey: keys.admin.workingHours, queryFn: () => api.get<WorkingHours[]>("/api/admin/working-hours") });

export const useSaveWorkingHours = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (days: WorkingHours[]) => api.put<WorkingHours[]>("/api/admin/working-hours", { days }),
    onSuccess: (data) => {
      qc.setQueryData(keys.admin.workingHours, data);
      qc.invalidateQueries({ queryKey: keys.shop });
    },
  });
};

export const useTimeOff = () =>
  useQuery({ queryKey: keys.admin.timeOff, queryFn: () => api.get<TimeOff[]>("/api/admin/time-off") });

export const useAddTimeOff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; reason?: string }) => api.post<TimeOff>("/api/admin/time-off", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.admin.timeOff });
      qc.invalidateQueries({ queryKey: keys.shop });
    },
  });
};

export const useDeleteTimeOff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/time-off/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.admin.timeOff });
      qc.invalidateQueries({ queryKey: keys.shop });
    },
  });
};
