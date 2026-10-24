using Barbershop.Api.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Barbershop.Api.Realtime;

[Authorize(Policy = Policies.Admin)]
public class NotificationHub : Hub
{
    public const string Path = "/hubs/notifications";

    public static class Events
    {
        public const string AppointmentBooked = "appointmentBooked";
        public const string AppointmentCancelled = "appointmentCancelled";
    }
}
