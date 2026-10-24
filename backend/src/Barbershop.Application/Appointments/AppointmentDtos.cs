using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;

namespace Barbershop.Application.Appointments;

public record AppointmentDto(
    Guid Id,
    Guid ServiceId,
    string ServiceNameSq,
    string ServiceNameEn,
    int DurationMinutes,
    decimal Price,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    string ClientName,
    string ClientPhone,
    string CustomerEmail,
    string? Notes,
    AppointmentStatus Status,
    DateTimeOffset CreatedAt)
{
    public static AppointmentDto From(Appointment a) => new(
        a.Id,
        a.ServiceId,
        a.Service.NameSq,
        a.Service.NameEn,
        (int)(a.EndTime - a.StartTime).TotalMinutes,
        a.Price,
        a.StartTime,
        a.EndTime,
        a.ClientName,
        a.ClientPhone,
        a.Customer.Email,
        a.Notes,
        a.Status,
        a.CreatedAt);
}

public record CreateAppointmentRequest(
    Guid ServiceId,
    DateTimeOffset StartTime,
    string ClientName,
    string ClientPhone,
    string? Notes);

public record UpdateAppointmentStatusRequest(AppointmentStatus Status);

public record AdminAppointmentsQuery(DateOnly From, DateOnly To, AppointmentStatus? Status, string? Search);
