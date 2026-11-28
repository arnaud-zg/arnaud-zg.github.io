// Dev lore: one fun fact per technology, told on its card when a crate unlocks it. Keyed by the
// skill's name, any case; a skill with none shows none. Add one line to add a fact.
const LORE: Partial<Record<string, string>> = {
  typescript: "Anders Hejlsberg designed it, after Turbo Pascal and C#.",
  react: "Its first prototype at Facebook was called FaxJS.",
  "react native": "It began as a Facebook hackathon project in 2013.",
  php: "It first stood for Personal Home Page. Now the P stands for PHP.",
  wordpress: "It started in 2003 as a fork of an older blog engine, b2.",
  prestashop: "It began as phpOpenStore, a student project in Paris.",
  zend: "The name blends Zeev and Andi, who rewrote PHP's engine.",
  sql: "It was first spelled SEQUEL, until a trademark said no.",
  go: "Rob Pike, Ken Thompson and Robert Griesemer sketched it at Google.",
  shopify: "It started as an online snowboard shop called Snowdevil.",
  liquid: "Shopify's founder wrote this template language himself, in Ruby.",
  "node.js": "Ryan Dahl first showed it at JSConf EU, in 2009.",
  mongodb: "Its name comes from humongous.",
  ssr: "The web was born server-rendered: plain HTML, at CERN, in 1991.",
  "design systems": "Atomic design names its parts after chemistry: atoms, molecules, organisms.",
  microservices: "The word caught on at an architects' workshop near Venice, in 2011.",
  "event sourcing": "Accountants did it first: a ledger never erases, it only adds.",
  cqrs: "Greg Young named it, building on Bertrand Meyer's command-query separation.",
  ddd: "It comes from Eric Evans's 2003 book, known as the blue book.",
  monorepos: "Google keeps most of its code in one repository: billions of lines.",
  "module federation": "Zack Jackson created it; it shipped with webpack 5, in 2020.",
};
export const loreOf = (skill: string) => LORE[skill.toLowerCase()];
