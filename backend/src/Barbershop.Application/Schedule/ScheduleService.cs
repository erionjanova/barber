using Barbershop.Application.Common;
using Barbershop.Application.Common.Exceptions;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;
using Barbershop.Domain.Exceptions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Barbershop.Application.Schedule;

public class ScheduleService(
    IApplicationDbContext db,
    ShopClock clock,
    IOptions<ShopOptions> shopOptions,
    IValidator<UpdateWorkingHoursRequest> hoursValidator,
    IValidator<CreateTimeOffRequest> timeOffValidator)
{
    private readonly ShopOptions _shop = shopOptions.Value;

    public async Task<ShopInfoDto> GetShopInfoAsync(CancellationToken ct)
    {
        var today = clock.Today;
        var lastBookableDay = today.AddDays(_shop.BookingWindowDays);

        var closedDates = await db.TimeOffs.AsNoTracking()
            .Where(t => t.Date >= today && t.Date <= lastBookableDay)
            .OrderBy(t => t.Date)
            .Select(t => t.Date)
            .ToListAsync(ct);

        return new ShopInfoDto(
            _shop.Name,
            _shop.Address,
            _shop.Phone,
            _shop.Currency,
            _shop.TimeZone,
            _shop.BookingWindowDays,
            _shop.CancellationCutoffHours,
            today,
            await GetWorkingHoursAsync(ct),
            closedDates);
    }

    public async Task<IReadOnlyList<WorkingHoursDto>> GetWorkingHoursAsync(CancellationToken ct)
    {
        var hours = await db.WorkingHours.AsNoTracking().ToListAsync(ct);

        return hours
            .OrderBy(h => ((int)h.DayOfWeek + 6) % 7)
            .Select(WorkingHoursDto.From)
            .ToList();
    }

    public async Task<IReadOnlyList<WorkingHoursDto>> UpdateWorkingHoursAsync(UpdateWorkingHoursRequest request, CancellationToken ct)
    {
        await hoursValidator.ValidateAndThrowAsync(request, ct);

        var existing = await db.WorkingHours.ToDictionaryAsync(h => h.DayOfWeek, ct);
        foreach (var day in request.Days)
        {
            if (!existing.TryGetValue(day.DayOfWeek, out var entity))
            {
                entity = new WorkingHours { DayOfWeek = day.DayOfWeek };
                db.WorkingHours.Add(entity);
            }

            entity.IsOpen = day.IsOpen;
            entity.OpenTime = day.OpenTime;
            entity.CloseTime = day.CloseTime;
        }

        await db.SaveChangesAsync(ct);
        return await GetWorkingHoursAsync(ct);
    }

    public async Task<IReadOnlyList<TimeOffDto>> GetUpcomingTimeOffAsync(CancellationToken ct)
    {
        var today = clock.Today;
        var timeOffs = await db.TimeOffs.AsNoTracking()
            .Where(t => t.Date >= today)
            .OrderBy(t => t.Date)
            .ToListAsync(ct);

        var result = new List<TimeOffDto>(timeOffs.Count);
        foreach (var t in timeOffs)
            result.Add(new TimeOffDto(t.Id, t.Date, t.Reason, await CountBookedOnAsync(t.Date, ct)));

        return result;
    }

    public async Task<TimeOffDto> AddTimeOffAsync(CreateTimeOffRequest request, CancellationToken ct)
    {
        await timeOffValidator.ValidateAndThrowAsync(request, ct);

        if (request.Date < clock.Today)
            throw new DomainException("date_in_past", "Time off can't be added in the past.");

        if (await db.TimeOffs.AnyAsync(t => t.Date == request.Date, ct))
            throw new ConflictException("time_off_exists", "This day is already marked as off.");

        var timeOff = new TimeOff
        {
            Date = request.Date,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim()
        };
        db.TimeOffs.Add(timeOff);
        await db.SaveChangesAsync(ct);

        return new TimeOffDto(timeOff.Id, timeOff.Date, timeOff.Reason, await CountBookedOnAsync(timeOff.Date, ct));
    }

    public async Task DeleteTimeOffAsync(Guid id, CancellationToken ct)
    {
        var timeOff = await db.TimeOffs.SingleOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new NotFoundException("time_off_not_found", "Day off not found.");

        db.TimeOffs.Remove(timeOff);
        await db.SaveChangesAsync(ct);
    }

    private Task<int> CountBookedOnAsync(DateOnly date, CancellationToken ct)
    {
        var (start, end) = clock.DayRangeUtc(date);
        return db.Appointments.CountAsync(
            a => a.Status == AppointmentStatus.Booked && a.StartTime >= start && a.StartTime < end, ct);
    }
}
