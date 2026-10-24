using FluentValidation;

namespace Barbershop.Application.Schedule;

public class UpdateWorkingHoursRequestValidator : AbstractValidator<UpdateWorkingHoursRequest>
{
    public UpdateWorkingHoursRequestValidator()
    {
        RuleFor(x => x.Days)
            .NotNull()
            .Must(days => days.Count == 7 && days.Select(d => d.DayOfWeek).Distinct().Count() == 7)
            .WithMessage("All seven days of the week must be provided exactly once.");

        RuleForEach(x => x.Days)
            .Must(d => !d.IsOpen || d.OpenTime < d.CloseTime)
            .WithMessage("Opening time must be before closing time.");
    }
}

public class CreateTimeOffRequestValidator : AbstractValidator<CreateTimeOffRequest>
{
    public CreateTimeOffRequestValidator()
    {
        RuleFor(x => x.Reason).MaximumLength(200);
    }
}
