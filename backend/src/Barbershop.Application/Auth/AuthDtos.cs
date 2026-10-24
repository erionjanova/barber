using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;

namespace Barbershop.Application.Auth;

public record RegisterRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    string PreferredLanguage);

public record LoginRequest(string Email, string Password);

public record UpdateProfileRequest(string FullName, string PhoneNumber, string PreferredLanguage);

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    UserRole Role,
    string PreferredLanguage)
{
    public static UserDto From(User user) =>
        new(user.Id, user.FullName, user.Email, user.PhoneNumber, user.Role, user.PreferredLanguage);
}

public record AuthResponse(string Token, DateTimeOffset ExpiresAt, UserDto User);
