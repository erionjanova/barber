using Barbershop.Domain.Entities;

namespace Barbershop.Application.Catalog;

public record ServiceDto(
    Guid Id,
    string NameSq,
    string NameEn,
    string? DescriptionSq,
    string? DescriptionEn,
    int DurationMinutes,
    decimal Price,
    bool IsActive,
    int SortOrder)
{
    public static ServiceDto From(Service s) =>
        new(s.Id, s.NameSq, s.NameEn, s.DescriptionSq, s.DescriptionEn, s.DurationMinutes, s.Price, s.IsActive, s.SortOrder);
}

public record UpsertServiceRequest(
    string NameSq,
    string NameEn,
    string? DescriptionSq,
    string? DescriptionEn,
    int DurationMinutes,
    decimal Price,
    bool IsActive,
    int SortOrder);
