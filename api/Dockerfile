# Stage 1: Build & Restore
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy all project files to restore dependencies
COPY ["AgroEstimador.Api/AgroEstimador.Api.csproj", "AgroEstimador.Api/"]
COPY ["AgroEstimador.Application/AgroEstimador.Application.csproj", "AgroEstimador.Application/"]
COPY ["AgroEstimador.Domain/AgroEstimador.Domain.csproj", "AgroEstimador.Domain/"]
COPY ["AgroEstimador.Infrastructure/AgroEstimador.Infrastructure.csproj", "AgroEstimador.Infrastructure/"]
COPY ["AgroEstimador.Persistence/AgroEstimador.Persistence.csproj", "AgroEstimador.Persistence/"]
COPY ["AgroEstimador.Shared/AgroEstimador.Shared.csproj", "AgroEstimador.Shared/"]

RUN dotnet restore "AgroEstimador.Api/AgroEstimador.Api.csproj"

# Copy full source and publish release build
COPY . .
WORKDIR "/src/AgroEstimador.Api"
RUN dotnet publish "AgroEstimador.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AgroEstimador.Api.dll"]
