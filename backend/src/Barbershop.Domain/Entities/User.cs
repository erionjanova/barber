using Barbershop.Domain.Common;
using Barbershop.Domain.Enums;

namespace Barbershop.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;

    public string PreferredLanguage { get; set; } = "sq";

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
