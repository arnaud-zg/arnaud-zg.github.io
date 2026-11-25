// Who the site is about, for search engines: schema.org's ProfilePage, shown as JSON-LD.
import type { ProfilePage, WithContext } from "schema-dts";

import config from "../../portfolio.config";

type Job = { role: string; company: string };

export const profilePageOf = (job: Job, image: string): WithContext<ProfilePage> => {
  const { name, links, site } = config;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: site.url,
    mainEntity: {
      "@type": "Person",
      name,
      url: site.url,
      image: new URL(image, site.url).href,
      description: site.description,
      jobTitle: job.role,
      worksFor: { "@type": "Organization", name: job.company },
      sameAs: links.map(({ href }) => href),
    },
  };
};
