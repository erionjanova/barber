namespace Barbershop.Application.Common;

public class ShopOptions
{
    public const string SectionName = "Shop";

    public string Name { get; set; } = "Barbershop";
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    public string BarberEmail { get; set; } = string.Empty;

    public string BarberLanguage { get; set; } = "sq";

    public string TimeZone { get; set; } = "Europe/Tirane";

    public string Currency { get; set; } = "EUR";

    public int SlotIntervalMinutes { get; set; } = 15;

    public int BookingWindowDays { get; set; } = 30;

    public int MinimumNoticeMinutes { get; set; } = 60;

    public int CancellationCutoffHours { get; set; } = 2;

    public int MaxActiveBookingsPerCustomer { get; set; } = 3;

    public int ReminderHoursBefore { get; set; } = 24;

    public string FrontendUrl { get; set; } = "http://localhost:5173";
}
