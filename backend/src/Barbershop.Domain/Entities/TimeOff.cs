using Barbershop.Domain.Common;

namespace Barbershop.Domain.Entities;

public class TimeOff : BaseEntity
{
    public DateOnly Date { get; set; }
    public string? Reason { get; set; }
}
