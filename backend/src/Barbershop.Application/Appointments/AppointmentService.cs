using Barbershop.Application.Availability;
using Barbershop.Application.Common;
using Barbershop.Application.Common.Exceptions;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Application.Notifications;
using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;
using Barbershop.Domain.Exceptions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Barbershop.Application.Appointments;

public class AppointmentService(
    IApplicationDbContext db,
    ICurrentUser currentUser,
    AvailabilityService availability,
    AppointmentNotifier notifier,
    ShopClock clock,
    IOptions<ShopOptions> shopOptions,
    IValidator<CreateAppointmentRequest> createValidator,
    IValidator<UpdateAppointmentStatusRequest> statusValidator,
    IValidator<AdminAppointmentsQuery> queryValidator)
{
    private readonly ShopOptions _shop = shopOptions.Value;

    public async Task<AppointmentDto> BookAsync(CreateAppointmentRequest request, CancellationToken ct)
    {
        await createValidator.ValidateAndThrowAsync(request, ct);

        var customer = await GetCurrentCustomerAsync(ct);
        var service = await db.Services.SingleOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, ct)
            ?? throw new NotFoundException("service_not_found", "Service not found.");

        var now = clock.UtcNow;
        var activeBookings = await db.Appointments.CountAsync(
            a => a.CustomerId == customer.Id && a.Status == AppointmentStatus.Booked && a.StartTime > now, ct);
        if (activeBookings >= _shop.MaxActiveBookingsPerCustomer)
            throw new DomainException("too_many_bookings",
                $"You can have at most {_shop.MaxActiveBookingsPerCustomer} upcoming appointments.");

        var start = request.StartTime.ToUniversalTime();
        if (!await availability.IsSlotAvailableAsync(start, service.DurationMinutes, ct))
            throw new ConflictException("slot_unavailable", "This time is no longer available.");

        var appointment = new Appointment
        {
            Customer = customer,
            Service = service,
            StartTime = start,
            EndTime = start.AddMinutes(service.DurationMinutes),
            ClientName = request.ClientName.Trim(),
            ClientPhone = request.ClientPhone.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Price = service.Price
        };

        if (start - now <= TimeSpan.FromHours(_shop.ReminderHoursBefore))
            appointment.ReminderSentAt = now;

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync(ct);

        await notifier.BookedAsync(appointment, ct);
        return AppointmentDto.From(appointment);
    }

    public async Task<IReadOnlyList<AppointmentDto>> GetMineAsync(CancellationToken ct)
    {
        var userId = RequireUserId();
        var appointments = await WithDetails(db.Appointments.AsNoTracking())
            .Where(a => a.CustomerId == userId)
            .OrderByDescending(a => a.StartTime)
            .Take(100)
            .ToListAsync(ct);

        return appointments.Select(AppointmentDto.From).ToList();
    }

    public async Task<AppointmentDto> CancelMineAsync(Guid id, CancellationToken ct)
    {
        var userId = RequireUserId();
        var appointment = await WithDetails(db.Appointments)
            .SingleOrDefaultAsync(a => a.Id == id && a.CustomerId == userId, ct)
            ?? throw new NotFoundException("appointment_not_found", "Appointment not found.");

        var now = clock.UtcNow;
        if (appointment.StartTime - now < TimeSpan.FromHours(_shop.CancellationCutoffHours))
            throw new DomainException("cancellation_too_late",
                $"Appointments can only be cancelled up to {_shop.CancellationCutoffHours} hours before.");

        appointment.Cancel(now);
        await db.SaveChangesAsync(ct);

        await notifier.CancelledByCustomerAsync(appointment, ct);
        return AppointmentDto.From(appointment);
    }

    public async Task<IReadOnlyList<AppointmentDto>> ListAsync(AdminAppointmentsQuery query, CancellationToken ct)
    {
        await queryValidator.ValidateAndThrowAsync(query, ct);

        var (from, _) = clock.DayRangeUtc(query.From);
        var (_, to) = clock.DayRangeUtc(query.To);

        var q = WithDetails(db.Appointments.AsNoTracking())
            .Where(a => a.StartTime >= from && a.StartTime < to);

        if (query.Status is { } status)
            q = q.Where(a => a.Status == status);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            q = q.Where(a =>
                a.ClientName.ToLower().Contains(term) ||
                a.ClientPhone.Contains(term) ||
                a.Customer.Email.ToLower().Contains(term));
        }

        var appointments = await q.OrderBy(a => a.StartTime).ToListAsync(ct);
        return appointments.Select(AppointmentDto.From).ToList();
    }

    public async Task<AppointmentDto> UpdateStatusAsync(Guid id, UpdateAppointmentStatusRequest request, CancellationToken ct)
    {
        await statusValidator.ValidateAndThrowAsync(request, ct);

        var appointment = await WithDetails(db.Appointments).SingleOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException("appointment_not_found", "Appointment not found.");

        appointment.SetStatus(request.Status, clock.UtcNow);
        await db.SaveChangesAsync(ct);

        if (request.Status == AppointmentStatus.Cancelled)
            await notifier.CancelledByBarberAsync(appointment, ct);

        return AppointmentDto.From(appointment);
    }

    private static IQueryable<Appointment> WithDetails(IQueryable<Appointment> query) =>
        query.Include(a => a.Service).Include(a => a.Customer);

    private Guid RequireUserId() =>
        currentUser.UserId ?? throw new UnauthorizedException("not_authenticated", "You need to log in.");

    private async Task<User> GetCurrentCustomerAsync(CancellationToken ct)
    {
        var userId = RequireUserId();
        return await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("not_authenticated", "You need to log in.");
    }
}
