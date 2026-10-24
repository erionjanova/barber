using Barbershop.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Barbershop.Infrastructure.Persistence.Configurations;

public static class AppointmentConstraints
{
    public const string NoOverlap = "ex_appointments_no_overlap";
}

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.Property(a => a.ClientName).HasMaxLength(100).IsRequired();
        builder.Property(a => a.ClientPhone).HasMaxLength(20).IsRequired();
        builder.Property(a => a.Notes).HasMaxLength(500);
        builder.Property(a => a.Price).HasPrecision(10, 2);
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(a => a.Customer)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Service)
            .WithMany()
            .HasForeignKey(a => a.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.StartTime);
        builder.HasIndex(a => new { a.Status, a.ReminderSentAt });

        builder.ToTable(t => t.HasCheckConstraint("ck_appointments_end_after_start", "end_time > start_time"));
    }
}
