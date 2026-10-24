using Barbershop.Application.Appointments;

namespace Barbershop.Application.Common.Interfaces;

public interface IBarberNotifier
{
    Task AppointmentBookedAsync(AppointmentDto appointment, CancellationToken cancellationToken = default);
    Task AppointmentCancelledAsync(AppointmentDto appointment, CancellationToken cancellationToken = default);
}
