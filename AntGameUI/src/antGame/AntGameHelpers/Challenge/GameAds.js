/* eslint-disable no-unused-expressions */
/* eslint-disable no-sequences */
const loadAds = (g, a, m, e, A, d, s) => {
  g[A] =
    g[A] ||
    function () {
      (g[A].s = g[A].s || []).push(arguments);
    };
  g[A].l = 1 * new Date();
  (d = a.createElement("script")),
    (s = a.getElementsByTagName("script")[0]),
    (d.async = 1),
    (d.src =
      e +
      "?objid=" +
      m +
      "&jsdate=" +
      +new Date() +
      "&lang=" +
      g.navigator.language +
      "&rfunc=" +
      A +
      "&fromhost=" +
      "antgame.io" +
      "&refr=" +
      encodeURIComponent(a.referrer) +
      "&fromurl=" +
      encodeURIComponent("https://antgame.io/challenge/daily") +
      ""),
    s.parentNode.insertBefore(d, s);
};
window.loadGameAds = () =>
  loadAds(window, document, "gameadsbanner", "https://n.gameads.io/getcode", "GameAdsRenew");
