using AgroEstimador.Application.Lots.Commands;
using FluentValidation;

namespace AgroEstimador.Application.Common.Validators;

public class CreateLotCommandValidator : AbstractValidator<CreateLotCommand>
{
    public CreateLotCommandValidator()
    {
        RuleFor(x => x.FarmId)
            .NotEmpty().WithMessage("FarmId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Lot name is required.")
            .MaximumLength(100).WithMessage("Lot name cannot exceed 100 characters.");

        RuleFor(x => x.Hectares)
            .GreaterThan(0).WithMessage("Hectares must be greater than zero.")
            .When(x => x.Hectares.HasValue);

        RuleFor(x => x.CropType)
            .MaximumLength(100).WithMessage("Crop type cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.CropType));
    }
}

public class UpdateLotCommandValidator : AbstractValidator<UpdateLotCommand>
{
    public UpdateLotCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Lot Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Lot name is required.")
            .MaximumLength(100).WithMessage("Lot name cannot exceed 100 characters.");

        RuleFor(x => x.Hectares)
            .GreaterThan(0).WithMessage("Hectares must be greater than zero.")
            .When(x => x.Hectares.HasValue);

        RuleFor(x => x.CropType)
            .MaximumLength(100).WithMessage("Crop type cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.CropType));
    }
}
