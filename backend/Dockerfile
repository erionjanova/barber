FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Barbershop.slnx ./
COPY src/Barbershop.Domain/Barbershop.Domain.csproj src/Barbershop.Domain/
COPY src/Barbershop.Application/Barbershop.Application.csproj src/Barbershop.Application/
COPY src/Barbershop.Infrastructure/Barbershop.Infrastructure.csproj src/Barbershop.Infrastructure/
COPY src/Barbershop.Api/Barbershop.Api.csproj src/Barbershop.Api/
RUN dotnet restore src/Barbershop.Api/Barbershop.Api.csproj

COPY src/ src/
RUN dotnet publish src/Barbershop.Api/Barbershop.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

EXPOSE 8080
ENTRYPOINT ["dotnet", "Barbershop.Api.dll"]
