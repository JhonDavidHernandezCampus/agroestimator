using System.Linq;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AutoMapper;

namespace AgroEstimador.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── User ──
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s =>
                s.UserRoles != null && s.UserRoles.Any()
                    ? s.UserRoles.First().Role.Name
                    : string.Empty));

        // ── Farm ──
        CreateMap<Farm, FarmDto>();
        CreateMap<FarmStatistics, FarmStatisticsDto>();

        // ── Lot ──
        CreateMap<Lot, LotDto>();

        // ── Vehicle ──
        CreateMap<Vehicle, VehicleDto>();

        // ── Product ──
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.DefaultUnitAbbreviation, opt => opt.MapFrom(s =>
                s.DefaultUnit != null ? s.DefaultUnit.Abbreviation : null));

        CreateMap<ProductPriceHistory, ProductPriceHistoryDto>();

        // ── Harvest ──
        CreateMap<Harvest, HarvestDto>()
            .ForMember(d => d.Date, opt => opt.MapFrom(s => s.HarvestDate.ToString("yyyy-MM-dd")))
            .ForMember(d => d.FarmName, opt => opt.MapFrom(s => s.Farm != null ? s.Farm.Name : string.Empty))
            .ForMember(d => d.Lot, opt => opt.MapFrom(s => s.Lot != null ? s.Lot.Name : string.Empty))
            .ForMember(d => d.Product, opt => opt.MapFrom(s => s.Product != null ? s.Product.Name : string.Empty))
            .ForMember(d => d.Vehicle, opt => opt.MapFrom(s => s.Vehicle != null ? s.Vehicle.Name : string.Empty))
            .ForMember(d => d.Quantity, opt => opt.MapFrom(s => s.TotalBunches))
            .ForMember(d => d.AverageWeight, opt => opt.MapFrom(s =>
                s.Calculation != null ? s.Calculation.AverageWeightKg : 0m))
            .ForMember(d => d.EstimatedWeight, opt => opt.MapFrom(s =>
                s.Calculation != null ? s.Calculation.EstimatedTotalWeightKg : 0m))
            .ForMember(d => d.EstimatedValue, opt => opt.MapFrom(s =>
                s.Calculation != null ? (s.Calculation.EstimatedValue ?? 0m) : 0m))
            .ForMember(d => d.PricePerKg, opt => opt.MapFrom(s => s.PricePerKgAtHarvest));

        // ── HarvestSample ──
        CreateMap<HarvestSample, HarvestSampleDto>()
            .ForMember(d => d.Id, opt => opt.MapFrom(s => s.Id.ToString()))
            .ForMember(d => d.Weight, opt => opt.MapFrom(s => s.WeightKg))
            .ForMember(d => d.Quality, opt => opt.MapFrom(s => MapQualityToSpanish(s.Quality)));

        // ── SyncConflict ──
        CreateMap<SyncConflict, SyncConflictDto>();
    }

    private static string MapQualityToSpanish(string? quality) => quality switch
    {
        "high" => "Alta",
        "medium" => "Media",
        "low" => "Baja",
        _ => "Media"
    };
}
