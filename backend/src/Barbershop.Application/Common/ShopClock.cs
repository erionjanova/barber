using Microsoft.Extensions.Options;

namespace Barbershop.Application.Common;

public class ShopClock(TimeProvider timeProvider, IOptions<ShopOptions> options)
{
    private readonly TimeZoneInfo _zone = TimeZoneInfo.FindSystemTimeZoneById(options.Value.TimeZone);

    public TimeZoneInfo Zone => _zone;

    public DateTimeOffset UtcNow => timeProvider.GetUtcNow();

    public DateTimeOffset LocalNow => ToLocal(UtcNow);

    public DateOnly Today => DateOnly.FromDateTime(LocalNow.DateTime);

    public DateTimeOffset ToLocal(DateTimeOffset utc) => TimeZoneInfo.ConvertTime(utc, _zone);

    public DateTimeOffset ToUtc(DateOnly date, TimeOnly time)
    {
        var local = date.ToDateTime(time, DateTimeKind.Unspecified);
        return new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(local, _zone), TimeSpan.Zero);
    }

    public (DateTimeOffset Start, DateTimeOffset End) DayRangeUtc(DateOnly date) =>
        (ToUtc(date, TimeOnly.MinValue), ToUtc(date.AddDays(1), TimeOnly.MinValue));
}
