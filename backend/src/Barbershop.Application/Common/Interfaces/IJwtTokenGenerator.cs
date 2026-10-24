using Barbershop.Domain.Entities;

namespace Barbershop.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTimeOffset ExpiresAt) Generate(User user);
}
