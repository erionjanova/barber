using Barbershop.Domain.Common;

namespace Barbershop.Domain.Entities;

public class WorkingHours : BaseEntity
{
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsOpen { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }
}
