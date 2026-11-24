import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

// HeadInit links this design's icon. Starlight always links one too, to a file sites do not have.

export const onRequest = defineRouteMiddleware(({ locals }) => {
  const { starlightRoute: route } = locals as { starlightRoute: StarlightRouteData };
  route.head = route.head.filter(({ attrs }) => attrs?.rel !== "shortcut icon");
});
