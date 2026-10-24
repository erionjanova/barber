using Barbershop.Application.Availability;
using Barbershop.Application.Catalog;
using Barbershop.Application.Schedule;
using Microsoft.AspNetCore.Mvc;

namespace Barbershop.Api.Controllers;

[ApiController]
[Route("api")]
public class ShopController(
    ScheduleService schedule,
    CatalogService catalog,
    AvailabilityService availability) : ControllerBase
{
    [HttpGet("shop")]
    public Task<ShopInfoDto> GetShopInfo(CancellationToken ct) => schedule.GetShopInfoAsync(ct);

    [HttpGet("services")]
    public Task<IReadOnlyList<ServiceDto>> GetServices(CancellationToken ct) =>
        catalog.GetAsync(includeInactive: false, ct);

    [HttpGet("availability")]
    public Task<DayAvailabilityDto> GetAvailability(
        [FromQuery] DateOnly date, [FromQuery] Guid serviceId, CancellationToken ct) =>
        availability.GetDayAsync(date, serviceId, ct);
}
