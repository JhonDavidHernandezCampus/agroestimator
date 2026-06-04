using System.Linq;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Harvests.Commands;
using FluentValidation;

namespace AgroEstimador.Application.Common.Validators;

public class HarvestSampleDtoValidator : AbstractValidator<HarvestSampleDto>
{
    public HarvestSampleDtoValidator()
    {
        RuleFor(x => x.Weight)
            .GreaterThan(0).WithMessage("Sample weight must be greater than zero.");

        RuleFor(x => x.Quality)
            .NotEmpty().WithMessage("Sample quality is required.")
            .Must(q => q == "Alta" || q == "Media" || q == "Baja")
            .WithMessage("Quality must be 'Alta', 'Media', or 'Baja'.");
    }
}

public class CreateHarvestCommandValidator : AbstractValidator<CreateHarvestCommand>
{
    public CreateHarvestCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Harvest date is required.");

        RuleFor(x => x.FarmName)
            .NotEmpty().WithMessage("Farm name is required.")
            .MaximumLength(100).WithMessage("Farm name cannot exceed 100 characters.");

        RuleFor(x => x.Lot)
            .NotEmpty().WithMessage("Lot name is required.")
            .MaximumLength(100).WithMessage("Lot name cannot exceed 100 characters.");

        RuleFor(x => x.Product)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(100).WithMessage("Product name cannot exceed 100 characters.");

        RuleFor(x => x.Vehicle)
            .MaximumLength(100).WithMessage("Vehicle name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Vehicle));

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Total bunches quantity must be greater than zero.");

        RuleFor(x => x.Samples)
            .NotEmpty().WithMessage("At least one harvest sample is required.")
            .Must(s => s != null && s.Count >= 1).WithMessage("At least one sample weight is required.");

        RuleForEach(x => x.Samples)
            .SetValidator(new HarvestSampleDtoValidator());

        RuleFor(x => x.PricePerKg)
            .GreaterThan(0).WithMessage("Price per kg must be greater than zero.")
            .When(x => x.PricePerKg.HasValue);
    }
}

public class UpdateHarvestCommandValidator : AbstractValidator<UpdateHarvestCommand>
{
    public UpdateHarvestCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Harvest Id is required.");

        RuleFor(x => x.Lot)
            .MaximumLength(100).WithMessage("Lot name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Lot));

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Total bunches quantity must be greater than zero.")
            .When(x => x.Quantity.HasValue);

        RuleForEach(x => x.Samples)
            .SetValidator(new HarvestSampleDtoValidator())
            .When(x => x.Samples != null && x.Samples.Any());

        RuleFor(x => x.PricePerKg)
            .GreaterThan(0).WithMessage("Price per kg must be greater than zero.")
            .When(x => x.PricePerKg.HasValue);
    }
}
