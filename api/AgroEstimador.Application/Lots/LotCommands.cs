using System;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Lots.Commands;

public record CreateLotCommand(Guid FarmId, string Name, decimal? Hectares, string? CropType, DateTime? PlantingDate) : IRequest<LotDto>;

public record UpdateLotCommand(Guid Id, string Name, decimal? Hectares, string? CropType, DateTime? PlantingDate) : IRequest<LotDto?>;

public record DeleteLotCommand(Guid Id) : IRequest<bool>;

public class LotCommandsHandler :
    IRequestHandler<CreateLotCommand, LotDto>,
    IRequestHandler<UpdateLotCommand, LotDto?>,
    IRequestHandler<DeleteLotCommand, bool>
{
    private readonly IRepository<Lot> _lotRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public LotCommandsHandler(IRepository<Lot> lotRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _lotRepository = lotRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<LotDto> Handle(CreateLotCommand request, CancellationToken cancellationToken)
    {
        var lot = new Lot
        {
            FarmId = request.FarmId,
            Name = request.Name,
            Hectares = request.Hectares,
            CropType = request.CropType,
            PlantingDate = request.PlantingDate
        };

        await _lotRepository.AddAsync(lot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LotDto>(lot);
    }

    public async Task<LotDto?> Handle(UpdateLotCommand request, CancellationToken cancellationToken)
    {
        var lot = await _lotRepository.GetByIdAsync(request.Id);
        if (lot == null) return null;

        lot.Name = request.Name;
        lot.Hectares = request.Hectares;
        lot.CropType = request.CropType;
        lot.PlantingDate = request.PlantingDate;
        lot.UpdatedAt = DateTime.UtcNow;

        _lotRepository.Update(lot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LotDto>(lot);
    }

    public async Task<bool> Handle(DeleteLotCommand request, CancellationToken cancellationToken)
    {
        var lot = await _lotRepository.GetByIdAsync(request.Id);
        if (lot == null) return false;

        _lotRepository.Delete(lot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
