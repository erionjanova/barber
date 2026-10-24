using Barbershop.Application.Appointments;
using Barbershop.Application.Auth;
using Barbershop.Application.Availability;
using Barbershop.Application.Catalog;
using Barbershop.Application.Common;
using Barbershop.Application.Dashboard;
using Barbershop.Application.Notifications;
using Barbershop.Application.Schedule;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Barbershop.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<ShopClock>();

        services.AddScoped<AuthService>();
        services.AddScoped<CatalogService>();
        services.AddScoped<ScheduleService>();
        services.AddScoped<AvailabilityService>();
        services.AddScoped<AppointmentService>();
        services.AddScoped<AppointmentNotifier>();
        services.AddScoped<ReminderService>();
        services.AddScoped<DashboardService>();

        return services;
    }
}
