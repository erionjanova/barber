using Barbershop.Api.Auth;
using Barbershop.Application.Appointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Barbershop.Api.Controllers;

[ApiController]
[Authorize(Policy = Policies.Customer)]
[Route("api/appointments")]
public class AppointmentsController(AppointmentService appointments) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<AppointmentDto>> GetMine(CancellationToken ct) => appointments.GetMineAsync(ct);

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Book(CreateAppointmentRequest request, CancellationToken ct)
    {
        var appointment = await appointments.BookAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, appointment);
    }

    [HttpPost("{id:guid}/cancel")]
    public Task<AppointmentDto> Cancel(Guid id, CancellationToken ct) => appointments.CancelMineAsync(id, ct);
}
