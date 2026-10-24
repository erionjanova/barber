using Barbershop.Application.Availability;

namespace Barbershop.Application.Tests.Availability;

public class SlotCalculatorTests
{
    private static readonly DateOnly Day = new(2026, 11, 2);

    private static DateTimeOffset At(int hour, int minute = 0) =>
        new(Day.ToDateTime(new TimeOnly(hour, minute)), TimeSpan.Zero);

    private static SlotQuery Query(
        int duration = 30,
        int interval = 30,
        DateTimeOffset? earliest = null,
        IReadOnlyCollection<TimeRange>? busy = null) =>
        new(
            Day,
            new TimeOnly(9, 0),
            new TimeOnly(12, 0),
            duration,
            interval,
            earliest ?? DateTimeOffset.MinValue,
            busy ?? [],
            (d, t) => new DateTimeOffset(d.ToDateTime(t), TimeSpan.Zero));

    [Fact]
    public void Returns_every_interval_where_the_service_fits_before_closing()
    {
        var slots = SlotCalculator.Calculate(Query(duration: 45, interval: 30));

        Assert.Equal([At(9), At(9, 30), At(10), At(10, 30), At(11)], slots);
    }

    [Fact]
    public void Skips_slots_that_overlap_an_existing_booking()
    {
        var busy = new[] { new TimeRange(At(10), At(10, 45)) };

        var slots = SlotCalculator.Calculate(Query(duration: 30, interval: 15, busy: busy));

        Assert.DoesNotContain(At(9, 45), slots);
        Assert.DoesNotContain(At(10, 30), slots);
        Assert.Contains(At(9, 30), slots);
        Assert.Contains(At(10, 45), slots);
    }

    [Fact]
    public void Skips_slots_before_the_earliest_allowed_start()
    {
        var slots = SlotCalculator.Calculate(Query(earliest: At(10, 10)));

        Assert.Equal([At(10, 30), At(11), At(11, 30)], slots);
    }

    [Fact]
    public void Returns_nothing_when_the_service_is_longer_than_the_opening_hours()
    {
        Assert.Empty(SlotCalculator.Calculate(Query(duration: 240)));
    }
}
