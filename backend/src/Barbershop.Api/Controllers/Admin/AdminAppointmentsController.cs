using Barbershop.Api.Auth;
using Barbershop.Application.Appointments;
using Barbershop.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Barbershop.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = Policies.Admin)]
[Route("api/admin/appointments")]
public class AdminAppointmentsController(AppointmentService appointments) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<AppointmentDto>> List(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] AppointmentStatus? status,
        [FromQuery] string? search,
        CancellationToken ct) =>
        appointments.ListAsync(new AdminAppointmentsQuery(from, to, status, search), ct);

    [HttpPatch("{id:guid}/status")]
    public Task<AppointmentDto> UpdateStatus(Guid id, UpdateAppointmentStatusRequest request, CancellationToken ct) =>
        appointments.UpdateStatusAsync(id, request, ct);
}
