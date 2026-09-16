/* This app's service worker. The worker itself is the shared core's, in
   core/sw-core.js; this file only says what is specific to this app and hands
   it over on a global, because a worker has no module imports.

   BUMP `version` ON EVERY RELEASE — it is what retires the old cache. */
self.SW_APP = {
  cachePrefix: "skate-",
  version: "v5",
  /* The files that are this app's own, on top of the core shell. */
  shell: [
    "./css/fonts.css",
    "./css/tokens/colors.css",
    "./css/tokens/typography.css",
    "./css/tokens/spacing.css",
    "./css/app.css",
    "./js/data.js",
    "./js/sport.js",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/apple-touch-icon.png",
    /* THE FACES AND THE LETTERS, TOO. A cold Add-to-Home-Screen launch opened
       offline used to boot in system fonts with every picture missing: the
       fonts, the mascot, the body maps and every pose were reached only by the
       runtime cache-on-fetch, which has nothing in it until a first ONLINE
       view. They are also release-checked now, so replacing a pose without
       bumping the version below can no longer leave devices on the old one. */
    "./assets/fonts/quicksand-latin.woff2",
    "./assets/fonts/dancingscript-latin.woff2",
    "./assets/skate/hero-home.png",
    "./assets/skate/body-front.png",
    "./assets/skate/body-back.png",
    "./assets/skate/illo-welcome.png",
    "./assets/skate/illo-great-job.png",
    "./assets/skate/illo-way-to-go.png",
    "./assets/skate/illo-keep-going.png",
    "./assets/skate/illo-take-a-breath.png",
    "./assets/skate/illo-focus.png",
    "./assets/skate/illo-nice-work.png",
    "./assets/skate/illo-you-can-do-it.png"
  ]
};
importScripts("core/sw-core.js");
