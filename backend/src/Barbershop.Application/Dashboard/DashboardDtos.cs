using Barbershop.Application.Appointments;

namespace Barbershop.Application.Dashboard;

public record DailyCountDto(DateOnly Date, int Count);

public record TopServiceDto(Guid ServiceId, string NameSq, string NameEn, int Count, decimal Revenue);

public record DashboardStatsDto(
    int TodayAppointments,
    int UpcomingAppointments,
    decimal RevenueThisMonth,
    decimal ExpectedRevenueThisMonth,
    int CompletedThisMonth,
    int CancelledThisMonth,
    int NoShowsThisMonth,
    int TotalCustomers,
    AppointmentDto? NextAppointment,
    IReadOnlyList<DailyCountDto> NextSevenDays,
    IReadOnlyList<TopServiceDto> TopServices);
