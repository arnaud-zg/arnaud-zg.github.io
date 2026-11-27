// `explanation`: the skill's explanation page, when it has one: its title and its Markdown, read
// as is. Its relative links resolve against `href`.
export type Explanation = { readonly title: string; readonly body: string };
export type Skill = {
  readonly name: string;
  readonly use: string;
  readonly href: string;
  readonly explanation?: Explanation;
};
