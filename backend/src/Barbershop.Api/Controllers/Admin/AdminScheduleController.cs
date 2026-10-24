using Barbershop.Api.Auth;
using Barbershop.Application.Schedule;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Barbershop.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = Policies.Admin)]
[Route("api/admin")]
public class AdminScheduleController(ScheduleService schedule) : ControllerBase
{
    [HttpGet("working-hours")]
    public Task<IReadOnlyList<WorkingHoursDto>> GetWorkingHours(CancellationToken ct) =>
        schedule.GetWorkingHoursAsync(ct);

    [HttpPut("working-hours")]
    public Task<IReadOnlyList<WorkingHoursDto>> UpdateWorkingHours(UpdateWorkingHoursRequest request, CancellationToken ct) =>
        schedule.UpdateWorkingHoursAsync(request, ct);

    [HttpGet("time-off")]
    public Task<IReadOnlyList<TimeOffDto>> GetTimeOff(CancellationToken ct) =>
        schedule.GetUpcomingTimeOffAsync(ct);

    [HttpPost("time-off")]
    public async Task<ActionResult<TimeOffDto>> AddTimeOff(CreateTimeOffRequest request, CancellationToken ct)
    {
        var timeOff = await schedule.AddTimeOffAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, timeOff);
    }

    [HttpDelete("time-off/{id:guid}")]
    public async Task<IActionResult> DeleteTimeOff(Guid id, CancellationToken ct)
    {
        await schedule.DeleteTimeOffAsync(id, ct);
        return NoContent();
    }
}
