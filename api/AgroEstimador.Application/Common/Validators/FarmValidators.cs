using AgroEstimador.Application.Farms.Commands;
using FluentValidation;

namespace AgroEstimador.Application.Common.Validators;

public class CreateFarmCommandValidator : AbstractValidator<CreateFarmCommand>
{
    public CreateFarmCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Farm name is required.")
            .MaximumLength(100).WithMessage("Farm name cannot exceed 100 characters.");

        RuleFor(x => x.Location)
            .MaximumLength(255).WithMessage("Location cannot exceed 255 characters.")
            .When(x => !string.IsNullOrEmpty(x.Location));

        RuleFor(x => x.Municipality)
            .MaximumLength(100).WithMessage("Municipality cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Municipality));

        RuleFor(x => x.Department)
            .MaximumLength(100).WithMessage("Department cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Department));

        RuleFor(x => x.TotalHectares)
            .GreaterThan(0).WithMessage("Total hectares must be greater than zero.")
            .When(x => x.TotalHectares.HasValue);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90.")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180.")
            .When(x => x.Longitude.HasValue);
    }
}

public class UpdateFarmCommandValidator : AbstractValidator<UpdateFarmCommand>
{
    public UpdateFarmCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Farm Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Farm name is required.")
            .MaximumLength(100).WithMessage("Farm name cannot exceed 100 characters.");

        RuleFor(x => x.Location)
            .MaximumLength(255).WithMessage("Location cannot exceed 255 characters.")
            .When(x => !string.IsNullOrEmpty(x.Location));

        RuleFor(x => x.Municipality)
            .MaximumLength(100).WithMessage("Municipality cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Municipality));

        RuleFor(x => x.Department)
            .MaximumLength(100).WithMessage("Department cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Department));

        RuleFor(x => x.TotalHectares)
            .GreaterThan(0).WithMessage("Total hectares must be greater than zero.")
            .When(x => x.TotalHectares.HasValue);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90.")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180.")
            .When(x => x.Longitude.HasValue);
    }
}
