using System;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Vehicles.Commands;

public record CreateVehicleCommand(
    Guid UserId,
    string Name,
    string Plate,
    string? VehicleType,
    decimal CapacityKg,
    decimal? TareWeightKg,
    short? FuelLevel,
    DateTime? NextServiceDate,
    string Status,
    string? MaintenanceNotes) : IRequest<VehicleDto>;

public record UpdateVehicleCommand(
    Guid Id,
    string Name,
    string Plate,
    string? VehicleType,
    decimal CapacityKg,
    decimal? TareWeightKg,
    short? FuelLevel,
    DateTime? NextServiceDate,
    string Status,
    string? MaintenanceNotes) : IRequest<VehicleDto?>;

public record DeleteVehicleCommand(Guid Id) : IRequest<bool>;

public class VehicleCommandsHandler :
    IRequestHandler<CreateVehicleCommand, VehicleDto>,
    IRequestHandler<UpdateVehicleCommand, VehicleDto?>,
    IRequestHandler<DeleteVehicleCommand, bool>
{
    private readonly IRepository<Vehicle> _vehicleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public VehicleCommandsHandler(IRepository<Vehicle> vehicleRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _vehicleRepository = vehicleRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<VehicleDto> Handle(CreateVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = new Vehicle
        {
            UserId = request.UserId,
            Name = request.Name,
            Plate = request.Plate,
            VehicleType = request.VehicleType,
            CapacityKg = request.CapacityKg,
            TareWeightKg = request.TareWeightKg,
            FuelLevel = request.FuelLevel,
            NextServiceDate = request.NextServiceDate,
            Status = request.Status,
            MaintenanceNotes = request.MaintenanceNotes
        };

        await _vehicleRepository.AddAsync(vehicle);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<VehicleDto>(vehicle);
    }

    public async Task<VehicleDto?> Handle(UpdateVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id);
        if (vehicle == null) return null;

        vehicle.Name = request.Name;
        vehicle.Plate = request.Plate;
        vehicle.VehicleType = request.VehicleType;
        vehicle.CapacityKg = request.CapacityKg;
        vehicle.TareWeightKg = request.TareWeightKg;
        vehicle.FuelLevel = request.FuelLevel;
        vehicle.NextServiceDate = request.NextServiceDate;
        vehicle.Status = request.Status;
        vehicle.MaintenanceNotes = request.MaintenanceNotes;
        vehicle.UpdatedAt = DateTime.UtcNow;

        _vehicleRepository.Update(vehicle);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<VehicleDto>(vehicle);
    }

    public async Task<bool> Handle(DeleteVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id);
        if (vehicle == null) return false;

        _vehicleRepository.Delete(vehicle);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
