using Barbershop.Application.Common;
using FluentValidation;

namespace Barbershop.Application.Appointments;

public class CreateAppointmentRequestValidator : AbstractValidator<CreateAppointmentRequest>
{
    public CreateAppointmentRequestValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ClientPhone).ValidPhoneNumber();
        RuleFor(x => x.Notes).MaximumLength(500);
    }
}

public class UpdateAppointmentStatusRequestValidator : AbstractValidator<UpdateAppointmentStatusRequest>
{
    public UpdateAppointmentStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class AdminAppointmentsQueryValidator : AbstractValidator<AdminAppointmentsQuery>
{
    public AdminAppointmentsQueryValidator()
    {
        RuleFor(x => x.To).GreaterThanOrEqualTo(x => x.From);
        RuleFor(x => x).Must(x => x.To.DayNumber - x.From.DayNumber <= 366)
            .WithMessage("The date range can't be longer than a year.");
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Search).MaximumLength(100);
    }
}
