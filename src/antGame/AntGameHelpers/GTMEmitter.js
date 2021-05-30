export class GTMEmitter {
  static PlayHandler(state) {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "play-button",
        label: state ? "play" : "pause",
      },
    });
  }

  static ResetHandler() {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "reset",
        label: "",
      },
    });
  }

  static ClearHandler() {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "clear",
        label: "",
      },
    });
  }

  static SaveHandler() {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "save-map",
        label: "",
      },
    });
  }

  static LoadHandler() {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "load-map",
        label: "",
      },
    });
  }

  static SaveImageHandler(imageToSave) {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "save-image",
        label: imageToSave,
      },
    });
  }

  static LoadSampleHandler() {
    window.dataLayer.push({
      event: "event",
      eventProps: {
        category: "button-press",
        action: "load-sample",
        label: "",
      },
    });
  }
}
