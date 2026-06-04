using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Harvests.Queries;

public record GetHarvestsQuery(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? FarmName = null,
    string? LotName = null,
    string? ProductName = null,
    string? Status = null,
    int Page = 1,
    int Limit = 50) : IRequest<IEnumerable<HarvestDto>>;

public record GetHarvestByIdQuery(Guid Id) : IRequest<HarvestDto?>;

public class HarvestQueriesHandler :
    IRequestHandler<GetHarvestsQuery, IEnumerable<HarvestDto>>,
    IRequestHandler<GetHarvestByIdQuery, HarvestDto?>
{
    private readonly IHarvestRepository _harvestRepository;
    private readonly IMapper _mapper;

    public HarvestQueriesHandler(IHarvestRepository harvestRepository, IMapper mapper)
    {
        _harvestRepository = harvestRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<HarvestDto>> Handle(GetHarvestsQuery request, CancellationToken cancellationToken)
    {
        var harvests = await _harvestRepository.GetFilteredHarvestsAsync(
            request.StartDate,
            request.EndDate,
            request.FarmName,
            request.LotName,
            request.ProductName,
            request.Status,
            request.Page,
            request.Limit
        );

        return _mapper.Map<IEnumerable<HarvestDto>>(harvests);
    }

    public async Task<HarvestDto?> Handle(GetHarvestByIdQuery request, CancellationToken cancellationToken)
    {
        var harvest = await _harvestRepository.GetDetailsByIdAsync(request.Id);
        if (harvest == null) return null;

        return _mapper.Map<HarvestDto>(harvest);
    }
}
