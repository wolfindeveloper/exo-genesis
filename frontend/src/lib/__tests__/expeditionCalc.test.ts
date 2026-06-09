import { describe, it, expect } from 'vitest'
import { calculateZoneStats } from '../expeditionCalc'

describe('calculateZoneStats', () => {
  it('baseline — no artifacts, moderate stats', () => {
    const result = calculateZoneStats(0.1, 10, 4, 100, 1.2, 100)
    expect(result).toEqual({
      effectiveRisk: 0.05,
      effectiveFuelCost: 10,
      effectiveDuration: 3.3333333333333335,
      fuelOk: true,
      estimatedMaxDamage: 0.8,
      riskPercent: 5,
      durationHours: 3.3,
    })
  })

  it('high stability nearly eliminates risk', () => {
    const result = calculateZoneStats(0.5, 20, 8, 180, 2.0, 200)
    expect(result).toEqual({
      effectiveRisk: 0.04999999999999999,
      effectiveFuelCost: 20,
      effectiveDuration: 4,
      fuelOk: true,
      estimatedMaxDamage: 0.7,
      riskPercent: 5,
      durationHours: 4,
    })
  })

  it('low stability with insufficient fuel', () => {
    const result = calculateZoneStats(0.3, 15, 6, 30, 0.8, 5)
    expect(result).toEqual({
      effectiveRisk: 0.255,
      effectiveFuelCost: 15,
      effectiveDuration: 7.5,
      fuelOk: false,
      estimatedMaxDamage: 3.8,
      riskPercent: 26,
      durationHours: 7.5,
    })
  })

  it('artifact bonuses reduce risk, fuel, and duration', () => {
    const bonuses = [
      { damage_reduction: 0.02 },
      { fuel_efficiency: 0.1 },
      { speed_mod: 0.2 },
      { damage_reduction: 0.01 },
    ]
    const result = calculateZoneStats(0.1, 10, 4, 100, 1.2, 100, bonuses)
    expect(result).toEqual({
      effectiveRisk: 0.020000000000000004,
      effectiveFuelCost: 9,
      effectiveDuration: 2.666666666666667,
      fuelOk: true,
      estimatedMaxDamage: 0.3,
      riskPercent: 2,
      durationHours: 2.7,
    })
  })
})
