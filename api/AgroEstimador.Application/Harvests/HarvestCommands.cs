using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Harvests.Commands;

public record CreateHarvestCommand(
    Guid UserId,
    DateTime Date,
    string FarmName,
    string Lot,
    string Product,
    string Vehicle,
    int Quantity,
    List<HarvestSampleDto> Samples,
    decimal? PricePerKg,
    string? DeviceId = null,
    bool IsSynced = true,
    Guid? HarvestId = null) : IRequest<HarvestDto>;

public record UpdateHarvestCommand(
    Guid Id,
    string? Lot,
    int? Quantity,
    List<HarvestSampleDto>? Samples,
    decimal? PricePerKg) : IRequest<HarvestDto?>;

public record DeleteHarvestCommand(Guid Id) : IRequest<bool>;

public class HarvestCommandsHandler :
    IRequestHandler<CreateHarvestCommand, HarvestDto>,
    IRequestHandler<UpdateHarvestCommand, HarvestDto?>,
    IRequestHandler<DeleteHarvestCommand, bool>
{
    private readonly IHarvestRepository _harvestRepository;
    private readonly IRepository<Farm> _farmRepository;
    private readonly IRepository<Lot> _lotRepository;
    private readonly IRepository<Product> _productRepository;
    private readonly IRepository<Vehicle> _vehicleRepository;
    private readonly IRepository<MeasurementUnit> _unitRepository;
    private readonly IHarvestCalculationService _calculationService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public HarvestCommandsHandler(
        IHarvestRepository harvestRepository,
        IRepository<Farm> farmRepository,
        IRepository<Lot> lotRepository,
        IRepository<Product> productRepository,
        IRepository<Vehicle> vehicleRepository,
        IRepository<MeasurementUnit> unitRepository,
        IHarvestCalculationService calculationService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _harvestRepository = harvestRepository;
        _farmRepository = farmRepository;
        _lotRepository = lotRepository;
        _productRepository = productRepository;
        _vehicleRepository = vehicleRepository;
        _unitRepository = unitRepository;
        _calculationService = calculationService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<HarvestDto> Handle(CreateHarvestCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve or Create Farm
        var farms = await _farmRepository.FindAsync(f => f.UserId == request.UserId && f.Name.ToLower() == request.FarmName.ToLower());
        var farm = farms.FirstOrDefault();
        if (farm == null)
        {
            farm = new Farm
            {
                UserId = request.UserId,
                Name = request.FarmName,
                IsActive = true
            };
            await _farmRepository.AddAsync(farm);
        }

        // 2. Resolve or Create Product
        var products = await _productRepository.FindAsync(p => p.Name.ToLower() == request.Product.ToLower());
        var product = products.FirstOrDefault();
        if (product == null)
        {
            var units = await _unitRepository.FindAsync(u => u.Abbreviation.ToLower() == "kg");
            var kgUnit = units.FirstOrDefault();

            product = new Product
            {
                Name = request.Product,
                DefaultUnitId = kgUnit?.Id,
                CurrentPricePerKg = request.PricePerKg ?? 1150,
                IsActive = true
            };
            await _productRepository.AddAsync(product);
        }

        // 3. Resolve or Create Lot
        var lots = await _lotRepository.FindAsync(l => l.FarmId == farm.Id && l.Name.ToLower() == request.Lot.ToLower());
        var lot = lots.FirstOrDefault();
        if (lot == null)
        {
            lot = new Lot
            {
                FarmId = farm.Id,
                Name = request.Lot,
                IsActive = true
            };
            await _lotRepository.AddAsync(lot);
        }

        // 4. Resolve or Create Vehicle
        var vehicles = await _vehicleRepository.FindAsync(v => v.UserId == request.UserId && v.Name.ToLower() == request.Vehicle.ToLower());
        var vehicle = vehicles.FirstOrDefault();
        if (vehicle == null && !string.IsNullOrEmpty(request.Vehicle))
        {
            var randomPlate = $"VH-{new Random().Next(100, 999)}-{(char)new Random().Next(65, 90)}{(char)new Random().Next(65, 90)}";
            vehicle = new Vehicle
            {
                UserId = request.UserId,
                Name = request.Vehicle,
                Plate = randomPlate,
                CapacityKg = 15000,
                FuelLevel = 100,
                Status = "active",
                IsActive = true
            };
            await _vehicleRepository.AddAsync(vehicle);
        }

        // 5. Determine Price
        var price = request.PricePerKg ?? product.CurrentPricePerKg ?? 1150;

        // 6. Create Harvest Header
        var harvest = new Harvest
        {
            Id = request.HarvestId ?? Guid.NewGuid(),
            UserId = request.UserId,
            FarmId = farm.Id,
            LotId = lot.Id,
            ProductId = product.Id,
            VehicleId = vehicle?.Id,
            HarvestDate = request.Date,
            TotalBunches = request.Quantity,
            PricePerKgAtHarvest = price,
            Status = "completed", // Standard state since we do calculations immediately
            DeviceId = request.DeviceId,
            IsSynced = request.IsSynced
        };

        await _harvestRepository.AddAsync(harvest);

        // 7. Add Samples
        short sampleNo = 1;
        foreach (var sampleDto in request.Samples)
        {
            // Map Spanish UI qualities to DB English equivalents
            string dbQuality = sampleDto.Quality switch
            {
                "Alta" => "high",
                "Media" => "medium",
                "Baja" => "low",
                _ => "medium"
            };

            var sample = new HarvestSample
            {
                HarvestId = harvest.Id,
                SampleNumber = sampleNo++,
                WeightKg = sampleDto.Weight,
                Quality = dbQuality
            };
            harvest.Samples.Add(sample);
        }

        // 8. Run statistical calculation
        var calculation = _calculationService.Calculate(
            harvest.TotalBunches,
            harvest.PricePerKgAtHarvest,
            harvest.Samples.Select(s => s.WeightKg),
            request.UserId
        );
        calculation.HarvestId = harvest.Id;
        harvest.Calculation = calculation;

        // 9. Save Changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Map back to DTO
        var result = _mapper.Map<HarvestDto>(harvest);
        result.FarmName = farm.Name;
        result.Lot = lot.Name;
        result.Product = product.Name;
        result.Vehicle = vehicle?.Name ?? string.Empty;

        return result;
    }

    public async Task<HarvestDto?> Handle(UpdateHarvestCommand request, CancellationToken cancellationToken)
    {
        var harvest = await _harvestRepository.GetDetailsByIdAsync(request.Id);
        if (harvest == null) return null;

        // 1. Update simple header fields
        if (request.Quantity.HasValue)
        {
            harvest.TotalBunches = request.Quantity.Value;
        }
        if (request.PricePerKg.HasValue)
        {
            harvest.PricePerKgAtHarvest = request.PricePerKg.Value;
        }

        // 2. Update Lot if it changes
        if (!string.IsNullOrEmpty(request.Lot) && harvest.Lot?.Name != request.Lot)
        {
            var lots = await _lotRepository.FindAsync(l => l.FarmId == harvest.FarmId && l.Name.ToLower() == request.Lot.ToLower());
            var lot = lots.FirstOrDefault();
            if (lot == null)
            {
                lot = new Lot
                {
                    FarmId = harvest.FarmId,
                    Name = request.Lot,
                    IsActive = true
                };
                await _lotRepository.AddAsync(lot);
            }
            harvest.LotId = lot.Id;
            harvest.Lot = lot;
        }

        // 3. Update Samples and Recalculate
        if (request.Samples != null && request.Samples.Count > 0)
        {
            // Clear existing samples
            harvest.Samples.Clear();

            short sampleNo = 1;
            foreach (var sampleDto in request.Samples)
            {
                string dbQuality = sampleDto.Quality switch
                {
                    "Alta" => "high",
                    "Media" => "medium",
                    "Baja" => "low",
                    _ => "medium"
                };

                var sample = new HarvestSample
                {
                    HarvestId = harvest.Id,
                    SampleNumber = sampleNo++,
                    WeightKg = sampleDto.Weight,
                    Quality = dbQuality
                };
                harvest.Samples.Add(sample);
            }
        }

        // Trigger Recalculate
        var calculation = _calculationService.Calculate(
            harvest.TotalBunches,
            harvest.PricePerKgAtHarvest,
            harvest.Samples.Select(s => s.WeightKg),
            harvest.UserId
        );
        calculation.HarvestId = harvest.Id;

        // Update calculation record
        if (harvest.Calculation != null)
        {
            harvest.Calculation.SampleCount = calculation.SampleCount;
            harvest.Calculation.AverageWeightKg = calculation.AverageWeightKg;
            harvest.Calculation.StdDeviationKg = calculation.StdDeviationKg;
            harvest.Calculation.MinWeightKg = calculation.MinWeightKg;
            harvest.Calculation.MaxWeightKg = calculation.MaxWeightKg;
            harvest.Calculation.EstimatedTotalWeightKg = calculation.EstimatedTotalWeightKg;
            harvest.Calculation.EstimatedValue = calculation.EstimatedValue;
            harvest.Calculation.ConfidenceLevel = calculation.ConfidenceLevel;
            harvest.Calculation.CalculatedAt = DateTime.UtcNow;
        }
        else
        {
            harvest.Calculation = calculation;
        }

        harvest.UpdatedAt = DateTime.UtcNow;
        _harvestRepository.Update(harvest);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Fetch freshly updated details to return correct mapped names
        var updatedHarvest = await _harvestRepository.GetDetailsByIdAsync(harvest.Id);
        return _mapper.Map<HarvestDto>(updatedHarvest);
    }

    public async Task<bool> Handle(DeleteHarvestCommand request, CancellationToken cancellationToken)
    {
        var harvest = await _harvestRepository.GetByIdAsync(request.Id);
        if (harvest == null) return false;

        _harvestRepository.Delete(harvest);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
