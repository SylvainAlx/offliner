export const ENERGY_CONSUMPTION = {
  WIFI: 0.1,
  GSM: 0.2,
};

export const getPowerSavingEstimate = (durationInSeconds: number): string => {
  const result =
    (durationInSeconds / 3600) *
    (ENERGY_CONSUMPTION.WIFI + ENERGY_CONSUMPTION.GSM);

  return formatWithUnit(result);
};

export const getDurationFromEnergy = (energyInWh: number): number => {
  const totalConsumption = ENERGY_CONSUMPTION.WIFI + ENERGY_CONSUMPTION.GSM;

  // durée en secondes
  return Math.round((energyInWh * 3600) / totalConsumption);
};

const formatWithUnit = (value: number): string => {
  const units = ["", "k", "M", "G"];
  let unitIndex = 0;
  let scaledValue = value;

  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex++;
  }

  // si petit chiffre → garder 2 décimales max
  const formatted =
    scaledValue < 10
      ? scaledValue.toFixed(2)
      : scaledValue < 100
      ? scaledValue.toFixed(1)
      : Math.round(scaledValue).toString();

  return `${formatted} ${units[unitIndex]}Wh`;
};
