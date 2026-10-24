using Barbershop.Application.Appointments;
using Barbershop.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Barbershop.Api.Realtime;

public class SignalRBarberNotifier(IHubContext<NotificationHub> hub) : IBarberNotifier
{
    public Task AppointmentBookedAsync(AppointmentDto appointment, CancellationToken cancellationToken = default) =>
        hub.Clients.All.SendAsync(NotificationHub.Events.AppointmentBooked, appointment, cancellationToken);

    public Task AppointmentCancelledAsync(AppointmentDto appointment, CancellationToken cancellationToken = default) =>
        hub.Clients.All.SendAsync(NotificationHub.Events.AppointmentCancelled, appointment, cancellationToken);
}
