using System;
using System.Collections.Generic;
using AgroEstimador.Domain.Entities;

namespace AgroEstimador.Application.Common.Interfaces;

public interface IHarvestCalculationService
{
    HarvestCalculation Calculate(int totalBunches, decimal? pricePerKg, IEnumerable<decimal> sampleWeights, Guid? calculatedBy = null);
}
