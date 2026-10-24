using Barbershop.Application.Common.Exceptions;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Entities;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Barbershop.Application.Catalog;

public class CatalogService(IApplicationDbContext db, IValidator<UpsertServiceRequest> validator)
{
    public async Task<IReadOnlyList<ServiceDto>> GetAsync(bool includeInactive, CancellationToken ct)
    {
        var query = db.Services.AsNoTracking();
        if (!includeInactive)
            query = query.Where(s => s.IsActive);

        var services = await query.OrderBy(s => s.SortOrder).ThenBy(s => s.NameEn).ToListAsync(ct);
        return services.Select(ServiceDto.From).ToList();
    }

    public async Task<ServiceDto> CreateAsync(UpsertServiceRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);

        var service = new Service();
        Apply(service, request);
        db.Services.Add(service);
        await db.SaveChangesAsync(ct);

        return ServiceDto.From(service);
    }

    public async Task<ServiceDto> UpdateAsync(Guid id, UpsertServiceRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);

        var service = await FindAsync(id, ct);
        Apply(service, request);
        await db.SaveChangesAsync(ct);

        return ServiceDto.From(service);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var service = await FindAsync(id, ct);

        if (await db.Appointments.AnyAsync(a => a.ServiceId == id, ct))
            service.IsActive = false;
        else
            db.Services.Remove(service);

        await db.SaveChangesAsync(ct);
    }

    private async Task<Service> FindAsync(Guid id, CancellationToken ct) =>
        await db.Services.SingleOrDefaultAsync(s => s.Id == id, ct)
        ?? throw new NotFoundException("service_not_found", "Service not found.");

    private static void Apply(Service service, UpsertServiceRequest r)
    {
        service.NameSq = r.NameSq.Trim();
        service.NameEn = r.NameEn.Trim();
        service.DescriptionSq = string.IsNullOrWhiteSpace(r.DescriptionSq) ? null : r.DescriptionSq.Trim();
        service.DescriptionEn = string.IsNullOrWhiteSpace(r.DescriptionEn) ? null : r.DescriptionEn.Trim();
        service.DurationMinutes = r.DurationMinutes;
        service.Price = r.Price;
        service.IsActive = r.IsActive;
        service.SortOrder = r.SortOrder;
    }
}
