export class CompatibilityHelper {
  static getCompatibilityDate(date) {
    date.setHours(date.getHours() - 12);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}_${month}_${day}`;
  }
}
