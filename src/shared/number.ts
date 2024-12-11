export class NumberFormatter {
  roundNumber(number: number): number {
    //  round to 2 decimal places
    const rouned = Math.round((number + Number.EPSILON) * 100) / 100;
    return rouned;
  }

  formatNumberGerman(number: number): string {
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    }).format(number);
  }

  parseToPureNumber(number: string): number {
    return parseFloat(number.replace(".", ","));
  }

  doIt(number: number): string {
    return this.formatNumberGerman(this.roundNumber(number));
  }
}
export const numberFormatter = new NumberFormatter();
