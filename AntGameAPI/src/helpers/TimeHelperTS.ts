export class TimeHelper {
  static getGeneralizedTimeString(milliseconds: number): string {
    const seconds = milliseconds / 1000;
    if (seconds < 60) return "Now";
    const minuets = seconds / 60;
    if (minuets < 60) return `${Math.floor(minuets)}m`;
    const hours = minuets / 60;
    if (hours < 24) return `${Math.floor(hours)}h`;
    const days = hours / 24;
    if (days < 14) return `${Math.floor(days)}d`;
    const weeks = days / 7;
    return `${Math.floor(weeks)}w`;
  }

  static getGeneralizedTimeStringFromObjectID(objectID: any): string {
    const recordTime = objectID.getTimestamp() as Date;
    const timeDelta = new Date().getTime() - recordTime.getTime();
    const timeString = TimeHelper.getGeneralizedTimeString(timeDelta);
    return timeString;
  }

  static getTimeStringForDailyChallenge(objectID: any): string {
    const recordTime = objectID.getTimestamp() as Date;

    const nextNoon = new Date(recordTime);
    if (nextNoon.getUTCHours() >= 12) nextNoon.setUTCDate(nextNoon.getUTCDate() + 1);
    nextNoon.setUTCHours(12);
    nextNoon.setUTCMinutes(0);
    nextNoon.setUTCSeconds(0);

    const delta = nextNoon.getTime() - recordTime.getTime();
    return `${TimeHelper.getGeneralizedTimeString(delta)} left`;
  }

  static getShortMonthName(date: Date): string {
    let month;
    switch (date.getMonth()) {
      case 0:
        month = "Jan";
        break;
      case 1:
        month = "Feb";
        break;
      case 2:
        month = "Mar";
        break;
      case 3:
        month = "Apr";
        break;
      case 4:
        month = "May";
        break;
      case 5:
        month = "Jun";
        break;
      case 6:
        month = "Jul";
        break;
      case 7:
        month = "Aug";
        break;
      case 8:
        month = "Sep";
        break;
      case 9:
        month = "Oct";
        break;
      case 10:
        month = "Nov";
        break;
      case 11:
        month = "Dec";
        break;
    }
    return month;
  }
}
