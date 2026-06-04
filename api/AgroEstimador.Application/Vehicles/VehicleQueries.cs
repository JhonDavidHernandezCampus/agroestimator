using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Vehicles.Queries;

public record GetVehiclesQuery(Guid UserId) : IRequest<IEnumerable<VehicleDto>>;

public record GetVehicleByIdQuery(Guid Id) : IRequest<VehicleDto?>;

public class VehicleQueriesHandler :
    IRequestHandler<GetVehiclesQuery, IEnumerable<VehicleDto>>,
    IRequestHandler<GetVehicleByIdQuery, VehicleDto?>
{
    private readonly IRepository<Vehicle> _vehicleRepository;
    private readonly IMapper _mapper;

    public VehicleQueriesHandler(IRepository<Vehicle> vehicleRepository, IMapper mapper)
    {
        _vehicleRepository = vehicleRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<VehicleDto>> Handle(GetVehiclesQuery request, CancellationToken cancellationToken)
    {
        var vehicles = await _vehicleRepository.FindAsync(v => v.UserId == request.UserId && v.IsActive);
        return _mapper.Map<IEnumerable<VehicleDto>>(vehicles);
    }

    public async Task<VehicleDto?> Handle(GetVehicleByIdQuery request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id);
        if (vehicle == null || !vehicle.IsActive) return null;

        return _mapper.Map<VehicleDto>(vehicle);
    }
}
