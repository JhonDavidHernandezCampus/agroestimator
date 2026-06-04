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

namespace AgroEstimador.Application.Farms.Queries;

public record GetFarmsQuery(Guid UserId) : IRequest<IEnumerable<FarmDto>>;

public record GetFarmByIdQuery(Guid Id) : IRequest<FarmDto?>;

public record GetFarmStatisticsQuery(Guid UserId, Guid FarmId) : IRequest<FarmStatisticsDto?>;

public class FarmQueriesHandler :
    IRequestHandler<GetFarmsQuery, IEnumerable<FarmDto>>,
    IRequestHandler<GetFarmByIdQuery, FarmDto?>,
    IRequestHandler<GetFarmStatisticsQuery, FarmStatisticsDto?>
{
    private readonly IRepository<Farm> _farmRepository;
    private readonly IRepository<FarmStatistics> _statsRepository;
    private readonly IMapper _mapper;

    public FarmQueriesHandler(
        IRepository<Farm> farmRepository,
        IRepository<FarmStatistics> statsRepository,
        IMapper mapper)
    {
        _farmRepository = farmRepository;
        _statsRepository = statsRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<FarmDto>> Handle(GetFarmsQuery request, CancellationToken cancellationToken)
    {
        var farms = await _farmRepository.FindAsync(f => f.UserId == request.UserId && f.IsActive);
        return _mapper.Map<IEnumerable<FarmDto>>(farms);
    }

    public async Task<FarmDto?> Handle(GetFarmByIdQuery request, CancellationToken cancellationToken)
    {
        var farm = await _farmRepository.GetByIdAsync(request.Id);
        if (farm == null || !farm.IsActive) return null;

        return _mapper.Map<FarmDto>(farm);
    }

    public async Task<FarmStatisticsDto?> Handle(GetFarmStatisticsQuery request, CancellationToken cancellationToken)
    {
        var stats = await _statsRepository.FindAsync(s => s.FarmId == request.FarmId && s.UserId == request.UserId);
        var stat = stats.FirstOrDefault();
        if (stat == null) return null;

        return _mapper.Map<FarmStatisticsDto>(stat);
    }
}
