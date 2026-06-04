using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Products.Commands;

public record CreateProductCommand(string Name, string? Description, Guid? DefaultUnitId, decimal? CurrentPricePerKg) : IRequest<ProductDto>;

public record UpdateProductCommand(Guid Id, string Name, string? Description, Guid? DefaultUnitId, decimal? CurrentPricePerKg) : IRequest<ProductDto?>;

public record DeleteProductCommand(Guid Id) : IRequest<bool>;

public record CreateProductPriceCommand(Guid ProductId, decimal PricePerKg, DateTime EffectiveDate, string? Source, Guid? CreatedBy) : IRequest<ProductPriceHistoryDto?>;

public class ProductCommandsHandler :
    IRequestHandler<CreateProductCommand, ProductDto>,
    IRequestHandler<UpdateProductCommand, ProductDto?>,
    IRequestHandler<DeleteProductCommand, bool>,
    IRequestHandler<CreateProductPriceCommand, ProductPriceHistoryDto?>
{
    private readonly IRepository<Product> _productRepository;
    private readonly IRepository<ProductPriceHistory> _priceHistoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ProductCommandsHandler(
        IRepository<Product> productRepository, 
        IRepository<ProductPriceHistory> priceHistoryRepository,
        IUnitOfWork unitOfWork, 
        IMapper mapper)
    {
        _productRepository = productRepository;
        _priceHistoryRepository = priceHistoryRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            DefaultUnitId = request.DefaultUnitId,
            CurrentPricePerKg = request.CurrentPricePerKg
        };

        await _productRepository.AddAsync(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto?> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.Id);
        if (product == null) return null;

        product.Name = request.Name;
        product.Description = request.Description;
        product.DefaultUnitId = request.DefaultUnitId;
        product.CurrentPricePerKg = request.CurrentPricePerKg;
        product.UpdatedAt = DateTime.UtcNow;

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.Id);
        if (product == null) return false;

        _productRepository.Delete(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProductPriceHistoryDto?> Handle(CreateProductPriceCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId);
        if (product == null) return null;

        // Close previous active price (where EndDate is null)
        var activePrices = await _priceHistoryRepository.FindAsync(ph => ph.ProductId == request.ProductId && ph.EndDate == null);
        var activePrice = activePrices.FirstOrDefault();
        if (activePrice != null)
        {
            activePrice.EndDate = request.EffectiveDate.AddDays(-1);
            _priceHistoryRepository.Update(activePrice);
        }

        var priceHistory = new ProductPriceHistory
        {
            ProductId = request.ProductId,
            PricePerKg = request.PricePerKg,
            EffectiveDate = request.EffectiveDate,
            EndDate = null,
            Source = request.Source,
            CreatedBy = request.CreatedBy
        };

        await _priceHistoryRepository.AddAsync(priceHistory);

        // Update current price on product catalog
        product.CurrentPricePerKg = request.PricePerKg;
        product.UpdatedAt = DateTime.UtcNow;
        _productRepository.Update(product);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ProductPriceHistoryDto>(priceHistory);
    }
}
