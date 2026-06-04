using AgroEstimador.Application.Products.Commands;
using FluentValidation;

namespace AgroEstimador.Application.Common.Validators;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(100).WithMessage("Product name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.CurrentPricePerKg)
            .GreaterThanOrEqualTo(0).WithMessage("Current price must be greater than or equal to zero.")
            .When(x => x.CurrentPricePerKg.HasValue);
    }
}

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Product Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(100).WithMessage("Product name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.CurrentPricePerKg)
            .GreaterThanOrEqualTo(0).WithMessage("Current price must be greater than or equal to zero.")
            .When(x => x.CurrentPricePerKg.HasValue);
    }
}

public class CreateProductPriceCommandValidator : AbstractValidator<CreateProductPriceCommand>
{
    public CreateProductPriceCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("ProductId is required.");

        RuleFor(x => x.PricePerKg)
            .GreaterThan(0).WithMessage("Price per kg must be greater than zero.");

        RuleFor(x => x.EffectiveDate)
            .NotEmpty().WithMessage("Effective date is required.");

        RuleFor(x => x.Source)
            .MaximumLength(100).WithMessage("Source description cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Source));
    }
}
