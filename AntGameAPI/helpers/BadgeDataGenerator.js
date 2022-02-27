class BadgeDataGenerator {
  static getFirstPlaceBadge(name) {
    return this.getTrophyBadge({ name: `1st ${name}`, backgroundColor: "gold", value: 99 });
  }

  static getSecondPlaceBadge(name) {
    return this.getTrophyBadge({ name: `2nd ${name}`, backgroundColor: "silver", value: 98 });
  }
  static getThirdPlaceBadge(name) {
    return this.getTrophyBadge({ name: `3rd ${name}`, backgroundColor: "bronze", value: 97 });
  }

  static getTopTenBadge(rank, name) {
    return this.getBadge({ name: `#${rank} ${name}`, backgroundColor: "green", value: 100 - rank });
  }

  static getTop50Badge(rank, name) {
    return this.getBadge({ name: `#${rank} ${name}`, color: "white", value: 100 - rank });
  }

  //#region helpers
  static getTrophyBadge({ name, backgroundColor, value }) {
    return this.getBadge({ icon: "trophy", name, backgroundColor, value });
  }

  static getBadge({ name, icon, backgroundColor, value, color }) {
    const toReturn = {};
    if (name) toReturn.name = name;
    if (icon) toReturn.icon = icon;
    if (backgroundColor) toReturn.backgroundColor = backgroundColor;
    if (value) toReturn.value = value;
    if (color) toReturn.color = color;
    return toReturn;
  }
  //#endregion
}
module.exports = { BadgeDataGenerator };
