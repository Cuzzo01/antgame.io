/* eslint-disable no-unused-expressions */
/* eslint-disable no-sequences */
if (!window.loadAds) {
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
        g.location.hostname +
        "&refr=" +
        encodeURIComponent(a.referrer) +
        "&fromurl=" +
        encodeURIComponent(g.location.href) +
        ""),
      s.parentNode.insertBefore(d, s);
  };
  window.loadGameAds = () => loadAds(window, document, "gameadsbanner", "https://n.gameads.io/getcode", "GameAdsRenew");
}
