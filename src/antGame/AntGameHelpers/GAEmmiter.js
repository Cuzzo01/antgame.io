import ReactGA from "react-ga";

export class GAEmitter {
  static playHandler(state) {
    ReactGA.event({
      category: "button-press",
      action: "play-button",
      label: state.toString(),
    });
  }

  static saveHandler() {
    ReactGA.event({
      category: "button-press",
      action: "save-button",
    });
  }

  static loadHandler() {
    ReactGA.event({
      category: "button-press",
      action: "load-button",
    });
  }

  static resetTimeHandler(seconds) {
    ReactGA.event({
      category: "button-press",
      action: "reset-time",
      value: seconds,
    });
  }
}
