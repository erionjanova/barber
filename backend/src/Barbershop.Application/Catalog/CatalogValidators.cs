using FluentValidation;

namespace Barbershop.Application.Catalog;

public class UpsertServiceRequestValidator : AbstractValidator<UpsertServiceRequest>
{
    public UpsertServiceRequestValidator()
    {
        RuleFor(x => x.NameSq).NotEmpty().MaximumLength(100);
        RuleFor(x => x.NameEn).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DescriptionSq).MaximumLength(500);
        RuleFor(x => x.DescriptionEn).MaximumLength(500);
        RuleFor(x => x.DurationMinutes).InclusiveBetween(5, 480);
        RuleFor(x => x.Price).InclusiveBetween(0, 10_000);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
