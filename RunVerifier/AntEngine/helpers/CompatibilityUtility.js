const { GetCompatibilityGoLiveDates } = require("../../service/AntGameApi");

class CompatibilityUtility {
  static DatesLoaded = false;
  static GoLiveDates = {
    NonUniformTrailStrength: false,
    RevertNonUniformTrailStrength: false,
    StartWithDropsToSkip: false,
    NonLinearTrailDecay: false,
  };

  static {
    this.PopulateGoLiveDates();
  }

  static async PopulateGoLiveDates() {
    try {
      const goLiveDataList = await GetCompatibilityGoLiveDates();
      for (const goLiveData of goLiveDataList) {
        if (this.GoLiveDates[goLiveData.featureName] !== undefined) {
          this.GoLiveDates[goLiveData.featureName] = this.ParseCompatibilityDate(goLiveData.goLive);
        }
      }
      this.DatesLoaded = true;
    } catch (e) {
      throw new Error("Unable to fetch goLiveDates");
    }
  }

  static UseNonLinearTrailDecay(compatibilityDate) {
    return this.IsFeatureLive(this.GoLiveDates.NonLinearTrailDecay, compatibilityDate);
  }

  static StartWithDropsToSkip(compatibilityDate) {
    return this.IsFeatureLive(this.GoLiveDates.StartWithDropsToSkip, compatibilityDate);
  }

  static UseNonUniformTrailStrength(compatibilityDate) {
    if (this.IsFeatureLive(this.GoLiveDates.RevertNonUniformTrailStrength, compatibilityDate))
      return false;
    else return this.IsFeatureLive(this.GoLiveDates.NonUniformTrailStrength, compatibilityDate);
  }

  static IsFeatureLive(goLiveDate, compatibilityDate) {
    if (!this.DatesLoaded) return true;
    else if (goLiveDate === false) return false;
    else if (compatibilityDate === null) return false;

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
