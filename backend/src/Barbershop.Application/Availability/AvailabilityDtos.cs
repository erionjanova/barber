namespace Barbershop.Application.Availability;

public record SlotDto(DateTimeOffset StartTime, string LocalTime);

public record DayAvailabilityDto(DateOnly Date, string? ClosedReason, IReadOnlyList<SlotDto> Slots);
