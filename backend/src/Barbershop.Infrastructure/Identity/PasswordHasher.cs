using Barbershop.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using IPasswordHasher = Barbershop.Application.Common.Interfaces.IPasswordHasher;

namespace Barbershop.Infrastructure.Identity;

public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public bool Verify(string hashedPassword, string providedPassword) =>
        _hasher.VerifyHashedPassword(null!, hashedPassword, providedPassword) != PasswordVerificationResult.Failed;
}
