import axios from "axios";

export class CompatibilityUtility {
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
      const goLiveDatesResponse = (await axios.get("/api/public/goLiveData")).data;
      for (const goLiveData of goLiveDatesResponse) {
        if (this.GoLiveDates[goLiveData.featureName] !== undefined) {
          this.GoLiveDates[goLiveData.featureName] = this.ParseCompatibilityDate(goLiveData.goLive);
        }
      }
      this.DatesLoaded = true;
    } catch (e) {
      console.error("Unable to pull compatibility go live dates");
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
