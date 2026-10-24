using Barbershop.Application.Appointments;
using Barbershop.Application.Common;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Barbershop.Application.Dashboard;

public class DashboardService(IApplicationDbContext db, ShopClock clock)
{
    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct)
    {
        var now = clock.UtcNow;
        var today = clock.Today;
        var (todayStart, todayEnd) = clock.DayRangeUtc(today);
        var monthStart = clock.ToUtc(new DateOnly(today.Year, today.Month, 1), TimeOnly.MinValue);
        var monthEnd = clock.ToUtc(new DateOnly(today.Year, today.Month, 1).AddMonths(1), TimeOnly.MinValue);
        var weekEnd = clock.DayRangeUtc(today.AddDays(6)).End;

        var appointments = db.Appointments.AsNoTracking();

        var todayCount = await appointments.CountAsync(
            a => a.Status != AppointmentStatus.Cancelled && a.StartTime >= todayStart && a.StartTime < todayEnd, ct);

        var upcomingCount = await appointments.CountAsync(
            a => a.Status == AppointmentStatus.Booked && a.StartTime >= now, ct);

        var monthByStatus = await appointments
            .Where(a => a.StartTime >= monthStart && a.StartTime < monthEnd)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count(), Revenue = g.Sum(a => a.Price) })
            .ToListAsync(ct);

        int CountOf(AppointmentStatus s) => monthByStatus.FirstOrDefault(x => x.Status == s)?.Count ?? 0;
        decimal RevenueOf(AppointmentStatus s) => monthByStatus.FirstOrDefault(x => x.Status == s)?.Revenue ?? 0;

        var totalCustomers = await db.Users.CountAsync(u => u.Role == UserRole.Customer, ct);

        var next = await appointments
            .Include(a => a.Service)
            .Include(a => a.Customer)
            .Where(a => a.Status == AppointmentStatus.Booked && a.StartTime >= now)
            .OrderBy(a => a.StartTime)
            .FirstOrDefaultAsync(ct);

        var weekStarts = await appointments
            .Where(a => a.Status == AppointmentStatus.Booked && a.StartTime >= todayStart && a.StartTime < weekEnd)
            .Select(a => a.StartTime)
            .ToListAsync(ct);

        var nextSevenDays = Enumerable.Range(0, 7)
            .Select(i => today.AddDays(i))
            .Select(d => new DailyCountDto(d, weekStarts.Count(s => DateOnly.FromDateTime(clock.ToLocal(s).DateTime) == d)))
            .ToList();

        var topCounts = await appointments
            .Where(a => a.StartTime >= monthStart && a.StartTime < monthEnd
                        && (a.Status == AppointmentStatus.Completed || a.Status == AppointmentStatus.Booked))
            .GroupBy(a => a.ServiceId)
            .Select(g => new { ServiceId = g.Key, Count = g.Count(), Revenue = g.Sum(a => a.Price) })
            .OrderByDescending(s => s.Count)
            .Take(5)
            .ToListAsync(ct);

        var topIds = topCounts.Select(t => t.ServiceId).ToList();
        var names = await db.Services.AsNoTracking()
            .Where(s => topIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, ct);

        var topServices = topCounts
            .Select(t => new TopServiceDto(t.ServiceId, names[t.ServiceId].NameSq, names[t.ServiceId].NameEn, t.Count, t.Revenue))
            .ToList();

        return new DashboardStatsDto(
            todayCount,
            upcomingCount,
            RevenueOf(AppointmentStatus.Completed),
            RevenueOf(AppointmentStatus.Completed) + RevenueOf(AppointmentStatus.Booked),
            CountOf(AppointmentStatus.Completed),
            CountOf(AppointmentStatus.Cancelled),
            CountOf(AppointmentStatus.NoShow),
            totalCustomers,
            next is null ? null : AppointmentDto.From(next),
            nextSevenDays,
            topServices);
    }
}
