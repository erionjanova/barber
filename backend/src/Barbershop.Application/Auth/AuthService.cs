using Barbershop.Application.Common.Exceptions;
using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Entities;
using Barbershop.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Barbershop.Application.Auth;

public class AuthService(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator tokenGenerator,
    ICurrentUser currentUser,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IValidator<UpdateProfileRequest> profileValidator)
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        await registerValidator.ValidateAndThrowAsync(request, ct);

        var email = NormalizeEmail(request.Email);
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("email_taken", "An account with this email already exists.");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PhoneNumber = request.PhoneNumber.Trim(),
            PreferredLanguage = request.PreferredLanguage,
            Role = UserRole.Customer
        };
        user.PasswordHash = passwordHasher.Hash(request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return CreateResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        await loginValidator.ValidateAndThrowAsync(request, ct);

        var email = NormalizeEmail(request.Email);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !passwordHasher.Verify(user.PasswordHash, request.Password))
            throw new UnauthorizedException("invalid_credentials", "Email or password is incorrect.");

        return CreateResponse(user);
    }

    public async Task<UserDto> GetCurrentAsync(CancellationToken ct)
    {
        var user = await GetCurrentUserEntityAsync(ct);
        return UserDto.From(user);
    }

    public async Task<UserDto> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken ct)
    {
        await profileValidator.ValidateAndThrowAsync(request, ct);

        var user = await GetCurrentUserEntityAsync(ct);
        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();
        user.PreferredLanguage = request.PreferredLanguage;
        await db.SaveChangesAsync(ct);

        return UserDto.From(user);
    }

    private async Task<User> GetCurrentUserEntityAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("not_authenticated", "You need to log in.");

        return await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("not_authenticated", "You need to log in.");
    }

    private AuthResponse CreateResponse(User user)
    {
        var (token, expiresAt) = tokenGenerator.Generate(user);
        return new AuthResponse(token, expiresAt, UserDto.From(user));
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
