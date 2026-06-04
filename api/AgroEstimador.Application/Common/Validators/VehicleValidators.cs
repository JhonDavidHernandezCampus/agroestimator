using AgroEstimador.Application.Vehicles.Commands;
using FluentValidation;

namespace AgroEstimador.Application.Common.Validators;

public class CreateVehicleCommandValidator : AbstractValidator<CreateVehicleCommand>
{
    public CreateVehicleCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Vehicle name is required.")
            .MaximumLength(100).WithMessage("Vehicle name cannot exceed 100 characters.");

        RuleFor(x => x.Plate)
            .NotEmpty().WithMessage("Plate number is required.")
            .MaximumLength(20).WithMessage("Plate number cannot exceed 20 characters.");

        RuleFor(x => x.VehicleType)
            .MaximumLength(50).WithMessage("Vehicle type cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.VehicleType));

        RuleFor(x => x.CapacityKg)
            .GreaterThan(0).WithMessage("Capacity must be greater than zero.");

        RuleFor(x => x.TareWeightKg)
            .GreaterThan(0).WithMessage("Tare weight must be greater than zero.")
            .When(x => x.TareWeightKg.HasValue);

        RuleFor(x => x.FuelLevel)
            .InclusiveBetween((short)0, (short)100).WithMessage("Fuel level must be between 0 and 100.")
            .When(x => x.FuelLevel.HasValue);

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.")
            .MaximumLength(50).WithMessage("Status cannot exceed 50 characters.");
    }
}

public class UpdateVehicleCommandValidator : AbstractValidator<UpdateVehicleCommand>
{
    public UpdateVehicleCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Vehicle Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Vehicle name is required.")
            .MaximumLength(100).WithMessage("Vehicle name cannot exceed 100 characters.");

        RuleFor(x => x.Plate)
            .NotEmpty().WithMessage("Plate number is required.")
            .MaximumLength(20).WithMessage("Plate number cannot exceed 20 characters.");

        RuleFor(x => x.VehicleType)
            .MaximumLength(50).WithMessage("Vehicle type cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.VehicleType));

        RuleFor(x => x.CapacityKg)
            .GreaterThan(0).WithMessage("Capacity must be greater than zero.");

        RuleFor(x => x.TareWeightKg)
            .GreaterThan(0).WithMessage("Tare weight must be greater than zero.")
            .When(x => x.TareWeightKg.HasValue);

        RuleFor(x => x.FuelLevel)
            .InclusiveBetween((short)0, (short)100).WithMessage("Fuel level must be between 0 and 100.")
            .When(x => x.FuelLevel.HasValue);

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.")
            .MaximumLength(50).WithMessage("Status cannot exceed 50 characters.");
    }
}
