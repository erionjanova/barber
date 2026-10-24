using Barbershop.Api.Auth;
using Barbershop.Application.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Barbershop.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = Policies.Admin)]
[Route("api/admin/dashboard")]
public class AdminDashboardController(DashboardService dashboard) : ControllerBase
{
    [HttpGet]
    public Task<DashboardStatsDto> Get(CancellationToken ct) => dashboard.GetStatsAsync(ct);
}
