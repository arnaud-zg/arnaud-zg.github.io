---
title: agent-context-budget
description: "Scores context files against token budgets, shows which sections to cut"
---

CLAUDE.md or AGENTS.md grows past what an agent session should load.

## Install

```sh
pnpm add -D agent-context-budget
```

## Get started

1. Install it next to your context files.
2. Run the check from the directory holding `CLAUDE.md`:

   ```sh
   npx agent-context-budget check
   ```

   Each file gets a health bar. A file near its budget also gets a breakdown of which headings hold
   most of its tokens.

3. Dig into one file:

   ```sh
   npx agent-context-budget check --explain CLAUDE.md
   ```

4. Adjust the budgets, only the fields you change:

   ```json title="agent-context-budget.config.json"
   { "root": { "threshold": 4000 } }
   ```

:::note[Exit codes]
`1` means a file is over a hard budget, `2` means advisory findings only.
:::

## Documentation

- [Tutorial](https://github.com/arnaud-zg/js-packages/blob/main/docs/agent-context-budget/tutorial.md)
- [How-to](https://github.com/arnaud-zg/js-packages/blob/main/docs/agent-context-budget/how-to.md)
- [Reference](https://github.com/arnaud-zg/js-packages/blob/main/docs/agent-context-budget/reference.md)
- [Explanation](https://github.com/arnaud-zg/js-packages/blob/main/docs/agent-context-budget/explanation.md)
