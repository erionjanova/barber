namespace Barbershop.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid? UserId { get; }
    bool IsAdmin { get; }
}
