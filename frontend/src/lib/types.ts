export type Language = "sq" | "en";
export type UserRole = "Customer" | "Admin";
export type AppointmentStatus = "Booked" | "Completed" | "Cancelled" | "NoShow";
export type DayOfWeek = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  preferredLanguage: Language;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Service {
  id: string;
  nameSq: string;
  nameEn: string;
  descriptionSq: string | null;
  descriptionEn: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export type UpsertService = Omit<Service, "id">;

export interface WorkingHours {
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  currency: string;
  timeZone: string;
  bookingWindowDays: number;
  cancellationCutoffHours: number;
  today: string;
  workingHours: WorkingHours[];
  closedDates: string[];
}

export interface Slot {
  startTime: string;
  localTime: string;
}

export interface DayAvailability {
  date: string;
  closedReason: "closed" | "day_off" | "out_of_range" | null;
  slots: Slot[];
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceNameSq: string;
  serviceNameEn: string;
  durationMinutes: number;
  price: number;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  customerEmail: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface TimeOff {
  id: string;
  date: string;
  reason: string | null;
  bookedAppointments: number;
}

export interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  revenueThisMonth: number;
  expectedRevenueThisMonth: number;
  completedThisMonth: number;
  cancelledThisMonth: number;
  noShowsThisMonth: number;
  totalCustomers: number;
  nextAppointment: Appointment | null;
  nextSevenDays: { date: string; count: number }[];
  topServices: { serviceId: string; nameSq: string; nameEn: string; count: number; revenue: number }[];
}
