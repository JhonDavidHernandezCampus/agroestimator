using System;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Farms.Commands;

public record CreateFarmCommand(Guid UserId, string Name, string? Location, string? Municipality, string? Department, decimal? TotalHectares, decimal? Latitude, decimal? Longitude) : IRequest<FarmDto>;

public record UpdateFarmCommand(Guid Id, string Name, string? Location, string? Municipality, string? Department, decimal? TotalHectares, decimal? Latitude, decimal? Longitude) : IRequest<FarmDto?>;

public record DeleteFarmCommand(Guid Id) : IRequest<bool>;

public class FarmCommandsHandler : 
    IRequestHandler<CreateFarmCommand, FarmDto>,
    IRequestHandler<UpdateFarmCommand, FarmDto?>,
    IRequestHandler<DeleteFarmCommand, bool>
{
    private readonly IRepository<Farm> _farmRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public FarmCommandsHandler(IRepository<Farm> farmRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _farmRepository = farmRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<FarmDto> Handle(CreateFarmCommand request, CancellationToken cancellationToken)
    {
        var farm = new Farm
        {
            UserId = request.UserId,
            Name = request.Name,
            Location = request.Location,
            Municipality = request.Municipality,
            Department = request.Department,
            TotalHectares = request.TotalHectares,
            Latitude = request.Latitude,
            Longitude = request.Longitude
        };

        await _farmRepository.AddAsync(farm);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<FarmDto>(farm);
    }

    public async Task<FarmDto?> Handle(UpdateFarmCommand request, CancellationToken cancellationToken)
    {
        var farm = await _farmRepository.GetByIdAsync(request.Id);
        if (farm == null) return null;

        farm.Name = request.Name;
        farm.Location = request.Location;
        farm.Municipality = request.Municipality;
        farm.Department = request.Department;
        farm.TotalHectares = request.TotalHectares;
        farm.Latitude = request.Latitude;
        farm.Longitude = request.Longitude;
        farm.UpdatedAt = DateTime.UtcNow;

        _farmRepository.Update(farm);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<FarmDto>(farm);
    }

    public async Task<bool> Handle(DeleteFarmCommand request, CancellationToken cancellationToken)
    {
        var farm = await _farmRepository.GetByIdAsync(request.Id);
        if (farm == null) return false;

        _farmRepository.Delete(farm);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
