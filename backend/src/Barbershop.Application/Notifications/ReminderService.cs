using Barbershop.Application.Common;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Barbershop.Application.Notifications;

public class ReminderService(
    IApplicationDbContext db,
    AppointmentNotifier notifier,
    ShopClock clock,
    IOptions<ShopOptions> shopOptions)
{
    public async Task<int> SendDueRemindersAsync(CancellationToken ct)
    {
        var now = clock.UtcNow;
        var threshold = now.AddHours(shopOptions.Value.ReminderHoursBefore);

        var due = await db.Appointments
            .Include(a => a.Service)
            .Include(a => a.Customer)
            .Where(a => a.Status == AppointmentStatus.Booked
                        && a.ReminderSentAt == null
                        && a.StartTime > now
                        && a.StartTime <= threshold)
            .OrderBy(a => a.StartTime)
            .Take(100)
            .ToListAsync(ct);

        foreach (var appointment in due)
        {
            await notifier.ReminderAsync(appointment, ct);
            appointment.ReminderSentAt = now;
        }

        if (due.Count > 0)
            await db.SaveChangesAsync(ct);

        return due.Count;
    }
}
