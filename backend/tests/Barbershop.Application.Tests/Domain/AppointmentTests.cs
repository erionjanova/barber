using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;
using Barbershop.Domain.Exceptions;

namespace Barbershop.Application.Tests.Domain;

public class AppointmentTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 2, 10, 0, 0, TimeSpan.Zero);

    private static Appointment Booked(DateTimeOffset start) =>
        new() { StartTime = start, EndTime = start.AddMinutes(30), Status = AppointmentStatus.Booked };

    [Fact]
    public void Cancel_marks_a_booked_appointment_as_cancelled()
    {
        var appointment = Booked(Now.AddDays(1));

        appointment.Cancel(Now);

        Assert.Equal(AppointmentStatus.Cancelled, appointment.Status);
        Assert.Equal(Now, appointment.CancelledAt);
    }

    [Fact]
    public void Cancel_fails_when_already_cancelled()
    {
        var appointment = Booked(Now.AddDays(1));
        appointment.Cancel(Now);

        var ex = Assert.Throws<DomainException>(() => appointment.Cancel(Now));
        Assert.Equal("appointment_not_cancellable", ex.Code);
    }

    [Fact]
    public void Cannot_complete_an_appointment_that_has_not_started()
    {
        var appointment = Booked(Now.AddHours(1));

        var ex = Assert.Throws<DomainException>(() => appointment.SetStatus(AppointmentStatus.Completed, Now));
        Assert.Equal("appointment_not_started", ex.Code);
    }

    [Fact]
    public void Can_complete_an_appointment_that_has_started()
    {
        var appointment = Booked(Now.AddMinutes(-10));

        appointment.SetStatus(AppointmentStatus.Completed, Now);

        Assert.Equal(AppointmentStatus.Completed, appointment.Status);
    }
}
