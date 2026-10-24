namespace Barbershop.Api.Auth;

public static class Policies
{
    public const string Admin = "Admin";

    public const string Customer = "Customer";
}

public static class RateLimits
{
    public const string Auth = "auth";
}
