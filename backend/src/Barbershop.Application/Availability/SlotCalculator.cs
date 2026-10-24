namespace Barbershop.Application.Availability;

public record TimeRange(DateTimeOffset Start, DateTimeOffset End)
{
    public bool Overlaps(DateTimeOffset start, DateTimeOffset end) => start < End && Start < end;
}

public record SlotQuery(
    DateOnly Date,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    int DurationMinutes,
    int IntervalMinutes,
    DateTimeOffset EarliestStartUtc,
    IReadOnlyCollection<TimeRange> Busy,
    Func<DateOnly, TimeOnly, DateTimeOffset> ToUtc);

public static class SlotCalculator
{
    public static IReadOnlyList<DateTimeOffset> Calculate(SlotQuery q)
    {
        if (q.DurationMinutes <= 0 || q.IntervalMinutes <= 0 || q.OpenTime >= q.CloseTime)
            return [];

        var slots = new List<DateTimeOffset>();
        var duration = TimeSpan.FromMinutes(q.DurationMinutes);
        var openMinutes = (int)q.OpenTime.ToTimeSpan().TotalMinutes;
        var closeMinutes = (int)q.CloseTime.ToTimeSpan().TotalMinutes;

        for (var minute = openMinutes; minute + q.DurationMinutes <= closeMinutes; minute += q.IntervalMinutes)
        {
            var start = q.ToUtc(q.Date, TimeOnly.FromTimeSpan(TimeSpan.FromMinutes(minute)));
            var end = start + duration;

            if (start < q.EarliestStartUtc)
                continue;

            if (q.Busy.Any(b => b.Overlaps(start, end)))
                continue;

            slots.Add(start);
        }

        return slots;
    }
}
