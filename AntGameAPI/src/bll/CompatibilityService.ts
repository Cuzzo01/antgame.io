export class CompatibilityService {
  public static getCompatibilityDate(date: Date) {
    date.setHours(date.getHours() - 12);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}_${month}_${day}`;
  }
}
