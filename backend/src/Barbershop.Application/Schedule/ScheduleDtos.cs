using Barbershop.Domain.Entities;

namespace Barbershop.Application.Schedule;

public record WorkingHoursDto(DayOfWeek DayOfWeek, bool IsOpen, TimeOnly OpenTime, TimeOnly CloseTime)
{
    public static WorkingHoursDto From(WorkingHours w) => new(w.DayOfWeek, w.IsOpen, w.OpenTime, w.CloseTime);
}

public record UpdateWorkingHoursRequest(IReadOnlyList<WorkingHoursDto> Days);

public record TimeOffDto(Guid Id, DateOnly Date, string? Reason, int BookedAppointments);

public record CreateTimeOffRequest(DateOnly Date, string? Reason);

public record ShopInfoDto(
    string Name,
    string Address,
    string Phone,
    string Currency,
    string TimeZone,
    int BookingWindowDays,
    int CancellationCutoffHours,
    DateOnly Today,
    IReadOnlyList<WorkingHoursDto> WorkingHours,
    IReadOnlyList<DateOnly> ClosedDates);
