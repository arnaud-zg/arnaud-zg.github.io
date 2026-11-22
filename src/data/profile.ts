export const skills = [
  { group: "Frontend", items: ["TypeScript", "React", "Design systems", "SSR", "Visual testing"] },
  { group: "Mobile", items: ["React Native", "Expo"] },
  { group: "Architecture", items: ["Event sourcing", "CQRS", "DDD", "Microservices", "Node.js"] },
  { group: "Platform", items: ["Monorepos", "CI/CD", "Module Federation", "Observability", "AI tooling"] },
];

export const stations = [
  { year: "2013", name: "Agencies", role: "Full-stack developer", note: "Startups, Paris to Shanghai" },
  { year: "2017", name: "Veepee", role: "Front-end developer", note: "Ticketing, SEO, performance" },
  { year: "2019", name: "Onepark", role: "Mobile engineer", note: "React Native, maps, payments" },
  { year: "2020", name: "PayFit", role: "Senior software engineer", note: "Microservices, event sourcing" },
  { year: "2026", name: "Doctolib", role: "Software engineer", note: "Platform", now: true },
];

export const links = [
  { label: "GitHub", href: "https://github.com/arnaud-zg", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/arnaudzheng", icon: "linkedin" },
  { label: "Substack", href: "https://arnaudzg.substack.com", icon: "substack" },
] as const;
