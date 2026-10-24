using Barbershop.Application.Common.Interfaces;
using Barbershop.Domain.Enums;
using Barbershop.Infrastructure.Identity;

namespace Barbershop.Api.Auth;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid? UserId =>
        Guid.TryParse(httpContextAccessor.HttpContext?.User.FindFirst(JwtClaims.Subject)?.Value, out var id) ? id : null;

    public bool IsAdmin => httpContextAccessor.HttpContext?.User.IsInRole(nameof(UserRole.Admin)) ?? false;
}
