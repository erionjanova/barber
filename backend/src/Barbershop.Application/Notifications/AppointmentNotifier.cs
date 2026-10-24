using Barbershop.Application.Appointments;
using Barbershop.Application.Common;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Barbershop.Application.Notifications;

public class AppointmentNotifier(
    IEmailSender emailSender,
    IBarberNotifier barberNotifier,
    ShopClock clock,
    IOptions<ShopOptions> shopOptions,
    ILogger<AppointmentNotifier> logger)
{
    private readonly ShopOptions _shop = shopOptions.Value;

    public async Task BookedAsync(Appointment appointment, CancellationToken ct)
    {
        var lang = appointment.Customer.PreferredLanguage;
        await QueueAsync(appointment.Customer.Email, EmailTemplates.BookingConfirmation(lang, Model(appointment, lang), Shop()), ct);
        await NotifyBarberAsync(appointment, EmailTemplates.NewBookingForBarber, barberNotifier.AppointmentBookedAsync, ct);
    }

    public Task CancelledByCustomerAsync(Appointment appointment, CancellationToken ct) =>
        NotifyBarberAsync(appointment, EmailTemplates.CancellationForBarber, barberNotifier.AppointmentCancelledAsync, ct);

    public Task CancelledByBarberAsync(Appointment appointment, CancellationToken ct)
    {
        var lang = appointment.Customer.PreferredLanguage;
        return QueueAsync(appointment.Customer.Email, EmailTemplates.CancelledByBarber(lang, Model(appointment, lang), Shop()), ct);
    }

    public Task ReminderAsync(Appointment appointment, CancellationToken ct)
    {
        var lang = appointment.Customer.PreferredLanguage;
        return QueueAsync(appointment.Customer.Email, EmailTemplates.Reminder(lang, Model(appointment, lang), Shop()), ct);
    }

    private async Task NotifyBarberAsync(
        Appointment appointment,
        Func<string, AppointmentEmailModel, ShopEmailModel, (string, string)> template,
        Func<AppointmentDto, CancellationToken, Task> push,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(_shop.BarberEmail))
            await QueueAsync(_shop.BarberEmail, template(_shop.BarberLanguage, Model(appointment, _shop.BarberLanguage), Shop()), ct);

        try
        {
            await push(AppointmentDto.From(appointment), ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Real-time notification for appointment {AppointmentId} failed", appointment.Id);
        }
    }

    private async Task QueueAsync(string to, (string Subject, string Html) email, CancellationToken ct)
    {
        try
        {
            await emailSender.QueueAsync(new EmailMessage(to, email.Subject, email.Html), ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not queue email '{Subject}' to {To}", email.Subject, to);
        }
    }

    private AppointmentEmailModel Model(Appointment a, string lang) => new(
        a.ClientName,
        a.ClientPhone,
        a.Service.GetName(lang),
        clock.ToLocal(a.StartTime),
        (int)(a.EndTime - a.StartTime).TotalMinutes,
        a.Price,
        a.Notes);

    private ShopEmailModel Shop() =>
        new(_shop.Name, _shop.Address, _shop.Phone, _shop.Currency, _shop.FrontendUrl.TrimEnd('/'));
}
