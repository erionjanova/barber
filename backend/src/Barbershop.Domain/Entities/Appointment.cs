using Barbershop.Domain.Common;
using Barbershop.Domain.Enums;
using Barbershop.Domain.Exceptions;

namespace Barbershop.Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;

    public DateTimeOffset StartTime { get; set; }

    public DateTimeOffset EndTime { get; set; }

    public string ClientName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public decimal Price { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset? ReminderSentAt { get; set; }

    public void Cancel(DateTimeOffset now)
    {
        if (Status != AppointmentStatus.Booked)
            throw new DomainException("appointment_not_cancellable", "Only booked appointments can be cancelled.");

        Status = AppointmentStatus.Cancelled;
        CancelledAt = now;
    }

    public void SetStatus(AppointmentStatus status, DateTimeOffset now)
    {
        if (status == AppointmentStatus.Cancelled)
        {
            Cancel(now);
            return;
        }

        if ((status is AppointmentStatus.Completed or AppointmentStatus.NoShow) && StartTime > now)
            throw new DomainException("appointment_not_started", "An appointment can't be completed or marked as no-show before it starts.");

        Status = status;
    }
}
