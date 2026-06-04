using System;
using System.Collections.Generic;
using System.Linq;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Domain.Entities;

namespace AgroEstimador.Infrastructure.Services;

public class HarvestCalculationService : IHarvestCalculationService
{
    public HarvestCalculation Calculate(int totalBunches, decimal? pricePerKg, IEnumerable<decimal> sampleWeights, Guid? calculatedBy = null)
    {
        var weightsList = sampleWeights.ToList();
        if (weightsList.Count == 0)
        {
            throw new ArgumentException("Sample weights cannot be empty.", nameof(sampleWeights));
        }

        int count = weightsList.Count;
        decimal minWeight = weightsList.Min();
        decimal maxWeight = weightsList.Max();
        decimal averageWeight = weightsList.Average();

        // Sample Standard Deviation (divided by N - 1)
        decimal stdDev = 0;
        if (count > 1)
        {
            decimal sumOfSquares = weightsList.Sum(w => (w - averageWeight) * (w - averageWeight));
            stdDev = (decimal)Math.Sqrt((double)sumOfSquares / (count - 1));
        }

        // Estimated Total Weight
        decimal estimatedTotalWeight = totalBunches * averageWeight;

        // Estimated Value
        decimal price = pricePerKg ?? 0;
        decimal estimatedValue = estimatedTotalWeight * price;

        // We use Z = 1.96 for a 95% confidence level.
        // The confidence level percentage we store is 95.00% because the margin of error calculation uses Z = 1.96.
        decimal confidenceLevel = 95.00m;

        return new HarvestCalculation
        {
            Id = Guid.NewGuid(),
            SampleCount = count,
            AverageWeightKg = Math.Round(averageWeight, 3),
            StdDeviationKg = Math.Round(stdDev, 3),
            MinWeightKg = Math.Round(minWeight, 3),
            MaxWeightKg = Math.Round(maxWeight, 3),
            EstimatedTotalWeightKg = Math.Round(estimatedTotalWeight, 3),
            EstimatedValue = Math.Round(estimatedValue, 2),
            ConfidenceLevel = confidenceLevel,
            CalculationMethod = "simple_average",
            CalculatedAt = DateTime.UtcNow,
            CalculatedBy = calculatedBy
        };
    }
}
