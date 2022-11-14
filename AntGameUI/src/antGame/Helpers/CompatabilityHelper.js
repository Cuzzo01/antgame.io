export class CompatibilityHelper {
  static getCompatibilityDate(date) {
    date.setHours(date.getHours() - 12);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}_${month}_${day}`;
  }
}
