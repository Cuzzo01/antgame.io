class CompatibilityUtility {
  static NewTrailStrengthGoLive = this.GetGoLive(2022, 11, 6);

  static UseNewTrailStrength(compatibilityDate) {
    return this.IsFeatureLive(this.NewTrailStrengthGoLive, compatibilityDate);
  }
  
  static GetGoLive(year, month, day) {
    return new Date(year, month - 1, day);
  }

  static IsFeatureLive(goLiveDate, compatibilityDate) {
    if (compatibilityDate === null) return false;
    const parsedCompatibilityDate = this.ParseCompatibilityDate(compatibilityDate);
    return parsedCompatibilityDate >= goLiveDate;
  }

  static ParseCompatibilityDate(stringDate) {
    const dateArr = stringDate.split("_");
    const year = dateArr[0];
    const month = dateArr[1] - 1;
    const day = dateArr[2];
    return new Date(year, month, day);
  }
}

module.exports = { CompatibilityUtility };
