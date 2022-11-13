import axios from "axios";

export class CompatibilityUtility {
  static GoLiveDates = {
    NonUniformTrailStrength: false,
  };

  static {
    this.PopulateGoLiveDates();
  }

  static async PopulateGoLiveDates() {
    try {
      const goLiveDatesResponse = (await axios.get("/api/public/goLiveData")).data;
      for (const goLiveData of goLiveDatesResponse) {
        if (this.GoLiveDates[goLiveData.featureName] === false) {
          this.GoLiveDates[goLiveData.featureName] = this.ParseCompatibilityDate(goLiveData.goLive);
        }
      }
    } catch (e) {
      console.error("Unable to pull compatibility go live dates");
    }
  }

  static UseNonUniformTrailStrength(compatibilityDate) {
    return this.IsFeatureLive(this.GoLiveDates.NonUniformTrailStrength, compatibilityDate);
  }

  static IsFeatureLive(goLiveDate, compatibilityDate) {
    if (goLiveDate === false) return true;
    else if (compatibilityDate === null) return false;

    const parsedCompatibilityDate = this.ParseCompatibilityDate(compatibilityDate);
    return parsedCompatibilityDate >= goLiveDate;
  }

  static ParseCompatibilityDate(stringDate) {
    const dateArr = stringDate.split("_");
    const year = dateArr[0];
    const month = dateArr[1] - 1;
    const day = dateArr[2];
    return new Date(Date.UTC(year, month, day));
  }
}
