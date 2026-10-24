using Barbershop.Application.Notifications;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Barbershop.Infrastructure.BackgroundJobs;

public class ReminderWorker(IServiceScopeFactory scopeFactory, ILogger<ReminderWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var reminders = scope.ServiceProvider.GetRequiredService<ReminderService>();
                var sent = await reminders.SendDueRemindersAsync(stoppingToken);
                if (sent > 0)
                    logger.LogInformation("Queued {Count} appointment reminder(s)", sent);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Reminder run failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
