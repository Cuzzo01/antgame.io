import TagManager from "react-gtm-module";

const tagManagerArgs = {
  gtmId: "GTM-56N256D",
};

export default function GTMInitialize() {
  TagManager.initialize(tagManagerArgs);
  window.dataLayer.push({
    event: "pageview",
  });
}
