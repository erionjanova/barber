using Barbershop.Application.Common;
using Barbershop.Application.Common.Exceptions;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Barbershop.Application.Availability;

public class AvailabilityService(IApplicationDbContext db, ShopClock clock, IOptions<ShopOptions> shopOptions)
{
    private readonly ShopOptions _shop = shopOptions.Value;

    public async Task<DayAvailabilityDto> GetDayAsync(DateOnly date, Guid serviceId, CancellationToken ct)
    {
        var service = await db.Services.AsNoTracking()
            .SingleOrDefaultAsync(s => s.Id == serviceId && s.IsActive, ct)
            ?? throw new NotFoundException("service_not_found", "Service not found.");

        var (reason, slots) = await CalculateAsync(date, service.DurationMinutes, ct);

        return new DayAvailabilityDto(
            date,
            reason,
            slots.Select(s => new SlotDto(s, clock.ToLocal(s).ToString("HH:mm"))).ToList());
    }

    public async Task<bool> IsSlotAvailableAsync(DateTimeOffset startUtc, int durationMinutes, CancellationToken ct)
    {
        var date = DateOnly.FromDateTime(clock.ToLocal(startUtc).DateTime);
        var (_, slots) = await CalculateAsync(date, durationMinutes, ct);
        return slots.Contains(startUtc);
    }

    private async Task<(string? Reason, IReadOnlyList<DateTimeOffset> Slots)> CalculateAsync(
        DateOnly date, int durationMinutes, CancellationToken ct)
    {
        var today = clock.Today;
        if (date < today || date > today.AddDays(_shop.BookingWindowDays))
            return ("out_of_range", []);

        if (await db.TimeOffs.AnyAsync(t => t.Date == date, ct))
            return ("day_off", []);

        var hours = await db.WorkingHours.AsNoTracking()
            .SingleOrDefaultAsync(h => h.DayOfWeek == date.DayOfWeek, ct);
        if (hours is null || !hours.IsOpen)
            return ("closed", []);

        var (dayStart, dayEnd) = clock.DayRangeUtc(date);
        var busy = await db.Appointments.AsNoTracking()
            .Where(a => a.Status == AppointmentStatus.Booked && a.StartTime < dayEnd && a.EndTime > dayStart)
            .Select(a => new TimeRange(a.StartTime, a.EndTime))
            .ToListAsync(ct);

        var slots = SlotCalculator.Calculate(new SlotQuery(
            date,
            hours.OpenTime,
            hours.CloseTime,
            durationMinutes,
            _shop.SlotIntervalMinutes,
            clock.UtcNow.AddMinutes(_shop.MinimumNoticeMinutes),
            busy,
            clock.ToUtc));

        return (null, slots);
    }
}
