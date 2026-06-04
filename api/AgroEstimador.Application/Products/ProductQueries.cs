using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Products.Queries;

public record GetProductsQuery : IRequest<IEnumerable<ProductDto>>;

public record GetProductByIdQuery(Guid Id) : IRequest<ProductDto?>;

public record GetProductPricesQuery(Guid ProductId) : IRequest<IEnumerable<ProductPriceHistoryDto>>;

public class ProductQueriesHandler :
    IRequestHandler<GetProductsQuery, IEnumerable<ProductDto>>,
    IRequestHandler<GetProductByIdQuery, ProductDto?>,
    IRequestHandler<GetProductPricesQuery, IEnumerable<ProductPriceHistoryDto>>
{
    private readonly IRepository<Product> _productRepository;
    private readonly IRepository<ProductPriceHistory> _priceHistoryRepository;
    private readonly IMapper _mapper;

    public ProductQueriesHandler(
        IRepository<Product> productRepository, 
        IRepository<ProductPriceHistory> priceHistoryRepository,
        IMapper mapper)
    {
        _productRepository = productRepository;
        _priceHistoryRepository = priceHistoryRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _productRepository.FindAsync(p => p.IsActive);
        return _mapper.Map<IEnumerable<ProductDto>>(products);
    }

    public async Task<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.Id);
        if (product == null || !product.IsActive) return null;

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<IEnumerable<ProductPriceHistoryDto>> Handle(GetProductPricesQuery request, CancellationToken cancellationToken)
    {
        var prices = await _priceHistoryRepository.FindAsync(ph => ph.ProductId == request.ProductId);
        return _mapper.Map<IEnumerable<ProductPriceHistoryDto>>(prices);
    }
}
