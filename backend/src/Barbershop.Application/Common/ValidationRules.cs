using FluentValidation;

namespace Barbershop.Application.Common;

public static class ValidationRules
{
    public static readonly string[] SupportedLanguages = ["sq", "en"];

    public static IRuleBuilderOptions<T, string> ValidPhoneNumber<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty()
            .Matches(@"^\+?[0-9\s\-()]{6,20}$")
            .WithMessage("Phone number is not valid.");

    public static IRuleBuilderOptions<T, string> ValidLanguage<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(lang => SupportedLanguages.Contains(lang))
            .WithMessage("Language must be 'sq' or 'en'.");
}
