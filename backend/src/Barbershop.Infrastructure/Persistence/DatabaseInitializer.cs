using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Barbershop.Infrastructure.Persistence;

public class AdminOptions
{
    public const string SectionName = "Admin";

    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = "Barber";
    public string PhoneNumber { get; set; } = string.Empty;
}

public class DatabaseInitializer(
    ApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IOptions<AdminOptions> adminOptions,
    ILogger<DatabaseInitializer> logger)
{
    public async Task InitializeAsync(CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        await SeedAdminAsync(ct);
        await SeedWorkingHoursAsync(ct);
        await SeedServicesAsync(ct);
    }

    private async Task SeedAdminAsync(CancellationToken ct)
    {
        if (await db.Users.AnyAsync(u => u.Role == UserRole.Admin, ct))
            return;

        var admin = adminOptions.Value;
        if (string.IsNullOrWhiteSpace(admin.Email) || string.IsNullOrWhiteSpace(admin.Password))
        {
            logger.LogWarning("No admin account exists and Admin:Email / Admin:Password are not configured.");
            return;
        }

        var user = new User
        {
            FullName = admin.FullName,
            Email = admin.Email.Trim().ToLowerInvariant(),
            PhoneNumber = admin.PhoneNumber,
            Role = UserRole.Admin
        };
        user.PasswordHash = passwordHasher.Hash(admin.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Created admin account {Email}", user.Email);
    }

    private async Task SeedWorkingHoursAsync(CancellationToken ct)
    {
        if (await db.WorkingHours.AnyAsync(ct))
            return;

        foreach (var day in Enum.GetValues<DayOfWeek>())
        {
            db.WorkingHours.Add(day switch
            {
                DayOfWeek.Sunday => new WorkingHours { DayOfWeek = day, IsOpen = false, OpenTime = new(9, 0), CloseTime = new(17, 0) },
                DayOfWeek.Saturday => new WorkingHours { DayOfWeek = day, IsOpen = true, OpenTime = new(9, 0), CloseTime = new(17, 0) },
                _ => new WorkingHours { DayOfWeek = day, IsOpen = true, OpenTime = new(9, 0), CloseTime = new(19, 0) }
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedServicesAsync(CancellationToken ct)
    {
        if (await db.Services.AnyAsync(ct))
            return;

        db.Services.AddRange(
            new Service
            {
                NameSq = "Qethje klasike", NameEn = "Classic haircut",
                DescriptionSq = "Qethje me gërshërë ose makinë, larje dhe stilim.",
                DescriptionEn = "Scissor or clipper cut, wash and styling.",
                DurationMinutes = 30, Price = 10, SortOrder = 1
            },
            new Service
            {
                NameSq = "Qethje + mjekër", NameEn = "Haircut + beard",
                DescriptionSq = "Paketa e plotë: qethje dhe rregullim i mjekrës.",
                DescriptionEn = "The full package: haircut and beard trim.",
                DurationMinutes = 45, Price = 15, SortOrder = 2
            },
            new Service
            {
                NameSq = "Rregullim mjekre", NameEn = "Beard trim",
                DescriptionSq = "Formësim i mjekrës me brisk dhe peshqir të nxehtë.",
                DescriptionEn = "Beard shaping with razor and hot towel.",
                DurationMinutes = 20, Price = 7, SortOrder = 3
            },
            new Service
            {
                NameSq = "Fade", NameEn = "Skin fade",
                DescriptionSq = "Fade i pastër deri në lëkurë, me detaje.",
                DescriptionEn = "Clean skin fade with detailing.",
                DurationMinutes = 40, Price = 12, SortOrder = 4
            },
            new Service
            {
                NameSq = "Qethje për fëmijë", NameEn = "Kids haircut",
                DescriptionSq = "Për fëmijë deri në 12 vjeç.",
                DescriptionEn = "For kids up to 12 years old.",
                DurationMinutes = 25, Price = 7, SortOrder = 5
            });

        await db.SaveChangesAsync(ct);
    }
}
