using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Lots.Queries;

public record GetLotsQuery(Guid FarmId) : IRequest<IEnumerable<LotDto>>;

public record GetLotByIdQuery(Guid Id) : IRequest<LotDto?>;

public class LotQueriesHandler :
    IRequestHandler<GetLotsQuery, IEnumerable<LotDto>>,
    IRequestHandler<GetLotByIdQuery, LotDto?>
{
    private readonly IRepository<Lot> _lotRepository;
    private readonly IMapper _mapper;

    public LotQueriesHandler(IRepository<Lot> lotRepository, IMapper mapper)
    {
        _lotRepository = lotRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LotDto>> Handle(GetLotsQuery request, CancellationToken cancellationToken)
    {
        var lots = await _lotRepository.FindAsync(l => l.FarmId == request.FarmId && l.IsActive);
        return _mapper.Map<IEnumerable<LotDto>>(lots);
    }

    public async Task<LotDto?> Handle(GetLotByIdQuery request, CancellationToken cancellationToken)
    {
        var lot = await _lotRepository.GetByIdAsync(request.Id);
        if (lot == null || !lot.IsActive) return null;

        return _mapper.Map<LotDto>(lot);
    }
}
