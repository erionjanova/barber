using Barbershop.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Barbershop.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Service> Services { get; }
    DbSet<Appointment> Appointments { get; }
    DbSet<WorkingHours> WorkingHours { get; }
    DbSet<TimeOff> TimeOffs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
