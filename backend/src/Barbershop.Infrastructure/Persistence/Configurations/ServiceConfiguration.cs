using Barbershop.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Barbershop.Infrastructure.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.Property(s => s.NameSq).HasMaxLength(100).IsRequired();
        builder.Property(s => s.NameEn).HasMaxLength(100).IsRequired();
        builder.Property(s => s.DescriptionSq).HasMaxLength(500);
        builder.Property(s => s.DescriptionEn).HasMaxLength(500);
        builder.Property(s => s.Price).HasPrecision(10, 2);
    }
}
