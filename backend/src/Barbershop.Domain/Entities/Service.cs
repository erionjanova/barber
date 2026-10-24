using Barbershop.Domain.Common;

namespace Barbershop.Domain.Entities;

public class Service : BaseEntity
{
    public string NameSq { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionSq { get; set; }
    public string? DescriptionEn { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public string GetName(string language) => language == "en" ? NameEn : NameSq;
}
