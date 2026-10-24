using Barbershop.Api.Auth;
using Barbershop.Application.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Barbershop.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = Policies.Admin)]
[Route("api/admin/services")]
public class AdminServicesController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<ServiceDto>> GetAll(CancellationToken ct) =>
        catalog.GetAsync(includeInactive: true, ct);

    [HttpPost]
    public async Task<ActionResult<ServiceDto>> Create(UpsertServiceRequest request, CancellationToken ct)
    {
        var service = await catalog.CreateAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, service);
    }

    [HttpPut("{id:guid}")]
    public Task<ServiceDto> Update(Guid id, UpsertServiceRequest request, CancellationToken ct) =>
        catalog.UpdateAsync(id, request, ct);

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await catalog.DeleteAsync(id, ct);
        return NoContent();
    }
}
