using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Dashboard.Queries;

public record GetStatisticsQuery(Guid UserId) : IRequest<StatisticsDto>;

public record GetDashboardSummaryQuery(Guid UserId) : IRequest<DashboardSummaryDto>;

public record GetMonthlyProductionQuery(Guid UserId) : IRequest<IEnumerable<MonthlyProductionDto>>;

public record GetFarmStatsQuery(Guid UserId) : IRequest<IEnumerable<FarmStatsDto>>;

public record GetProductStatsQuery : IRequest<IEnumerable<ProductStatsDto>>;

public record GetTrendsQuery(Guid UserId) : IRequest<IEnumerable<TrendDto>>;

public class DashboardQueriesHandler :
    IRequestHandler<GetStatisticsQuery, StatisticsDto>,
    IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryDto>,
    IRequestHandler<GetMonthlyProductionQuery, IEnumerable<MonthlyProductionDto>>,
    IRequestHandler<GetFarmStatsQuery, IEnumerable<FarmStatsDto>>,
    IRequestHandler<GetProductStatsQuery, IEnumerable<ProductStatsDto>>,
    IRequestHandler<GetTrendsQuery, IEnumerable<TrendDto>>
{
    private readonly IHarvestRepository _harvestRepository;
    private readonly IRepository<Farm> _farmRepository;
    private readonly IRepository<Lot> _lotRepository;
    private readonly IRepository<Vehicle> _vehicleRepository;
    private readonly IRepository<MonthlyStatistics> _monthlyStatsRepository;
    private readonly IRepository<FarmStatistics> _farmStatsRepository;
    private readonly IRepository<ProductStatistics> _productStatsRepository;
    private readonly IMapper _mapper;

    public DashboardQueriesHandler(
        IHarvestRepository harvestRepository,
        IRepository<Farm> farmRepository,
        IRepository<Lot> lotRepository,
        IRepository<Vehicle> vehicleRepository,
        IRepository<MonthlyStatistics> monthlyStatsRepository,
        IRepository<FarmStatistics> farmStatsRepository,
        IRepository<ProductStatistics> productStatsRepository,
        IMapper mapper)
    {
        _harvestRepository = harvestRepository;
        _farmRepository = farmRepository;
        _lotRepository = lotRepository;
        _vehicleRepository = vehicleRepository;
        _monthlyStatsRepository = monthlyStatsRepository;
        _farmStatsRepository = farmStatsRepository;
        _productStatsRepository = productStatsRepository;
        _mapper = mapper;
    }

    public async Task<StatisticsDto> Handle(GetStatisticsQuery request, CancellationToken cancellationToken)
    {
        var harvests = await _harvestRepository.FindAsync(h => h.UserId == request.UserId && h.Status == "completed");
        var vehicles = await _vehicleRepository.FindAsync(v => v.UserId == request.UserId && v.IsActive);

        var totalWeight = 0m;
        var totalEarnings = 0m;

        foreach (var h in harvests)
        {
            if (h.Calculation != null)
            {
                totalWeight += h.Calculation.EstimatedTotalWeightKg;
                totalEarnings += h.Calculation.EstimatedValue ?? 0m;
            }
        }

        return new StatisticsDto
        {
            TotalHarvests = harvests.Count(),
            TotalWeight = totalWeight,
            EstimatedEarnings = totalEarnings,
            ActiveVehicles = vehicles.Count(v => v.Status == "active"),
            InMaintenanceVehicles = vehicles.Count(v => v.Status == "maintenance")
        };
    }

    public async Task<DashboardSummaryDto> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var harvests = await _harvestRepository.FindAsync(h => h.UserId == request.UserId && h.Status == "completed");
        var farms = await _farmRepository.FindAsync(f => f.UserId == request.UserId && f.IsActive);
        var farmIds = farms.Select(f => f.Id).ToList();
        var lots = await _lotRepository.FindAsync(l => farmIds.Contains(l.FarmId) && l.IsActive);

        var totalWeight = 0m;
        var totalValue = 0m;

        foreach (var h in harvests)
        {
            if (h.Calculation != null)
            {
                totalWeight += h.Calculation.EstimatedTotalWeightKg;
                totalValue += h.Calculation.EstimatedValue ?? 0m;
            }
        }

        return new DashboardSummaryDto
        {
            TotalHarvests = harvests.Count(),
            TotalFarms = farms.Count(),
            TotalLots = lots.Count(),
            TotalWeightEstimated = totalWeight,
            TotalValueEstimated = totalValue
        };
    }

    public async Task<IEnumerable<MonthlyProductionDto>> Handle(GetMonthlyProductionQuery request, CancellationToken cancellationToken)
    {
        var stats = await _monthlyStatsRepository.FindAsync(s => s.UserId == request.UserId);
        return stats.OrderBy(s => s.Month).Select(s => new MonthlyProductionDto
        {
            Month = s.Month.ToString("yyyy-MM"),
            TotalHarvests = (int)s.TotalHarvests,
            TotalBunches = (int)s.TotalBunches,
            TotalWeightKg = s.TotalWeightKg,
            TotalValue = s.TotalValue,
            AvgWeightPerBunch = s.AvgWeightPerBunch
        });
    }

    public async Task<IEnumerable<FarmStatsDto>> Handle(GetFarmStatsQuery request, CancellationToken cancellationToken)
    {
        var stats = await _farmStatsRepository.FindAsync(s => s.UserId == request.UserId);
        return stats.Select(s => new FarmStatsDto
        {
            FarmId = s.FarmId,
            FarmName = s.FarmName,
            TotalHarvests = (int)s.TotalHarvests,
            TotalWeightKg = s.TotalWeightKg,
            TotalValue = s.TotalValue
        });
    }

    public async Task<IEnumerable<ProductStatsDto>> Handle(GetProductStatsQuery request, CancellationToken cancellationToken)
    {
        var stats = await _productStatsRepository.GetAllAsync();
        return stats.Select(s => new ProductStatsDto
        {
            ProductId = s.ProductId,
            ProductName = s.ProductName,
            TotalHarvests = (int)s.TotalHarvests,
            TotalWeightKg = s.TotalWeightKg,
            TotalValue = s.TotalValue
        });
    }

    public async Task<IEnumerable<TrendDto>> Handle(GetTrendsQuery request, CancellationToken cancellationToken)
    {
        var harvests = await _harvestRepository.FindAsync(h => h.UserId == request.UserId && h.Status == "completed");
        
        var trends = harvests
            .Where(h => h.Calculation != null)
            .GroupBy(h => h.HarvestDate)
            .Select(g => new TrendDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                WeightKg = g.Sum(h => h.Calculation!.EstimatedTotalWeightKg),
                Value = g.Sum(h => h.Calculation!.EstimatedValue ?? 0m)
            })
            .OrderBy(t => t.Date)
            .ToList();

        return trends;
    }
}
