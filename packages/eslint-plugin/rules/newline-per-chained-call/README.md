---
---

# newline-per-chained-call

Chained method calls on a single line without line breaks are harder to read, so some developers place a newline character after each method call in the chain to make it more readable and easy to maintain.

Let's look at the following perfectly valid (but single line) code.

```js
d3.select("body").selectAll("p").data([4, 8, 15, 16, 23, 42 ]).enter().append("p").text(function(d) { return "I'm number " + d + "!"; });
```

However, with appropriate new lines, it becomes easy to read and understand. Look at the same code written below with line breaks after each call.

```js
d3
    .select("body")
    .selectAll("p")
    .data([
        4,
        8,
        15,
        16,
        23,
        42
    ])
    .enter()
    .append("p")
    .text(function (d) {
        return "I'm number " + d + "!";
    });
```

Another argument in favor of this style is that it improves the clarity of diffs when something in the method chain is changed:

Less clear:

```js
d3.select("body").selectAll("p").style("color", "white"); // [!code --]
d3.select("body").selectAll("p").style("color", "blue"); // [!code ++]
```

More clear:

```js
d3
    .select("body")
    .selectAll("p")
    .style("color", "white"); // [!code --]
    .style("color", "blue"); // [!code ++]
```

## Rule Details

This rule requires a newline after each call in a method chain or deep member access. Computed property accesses such as `instance[something]` are excluded.

## Options

This rule has an object option:

- `"ignoreChainWithDepth"` (default: `2`) allows chains up to a specified depth.
- `"tabWidth"` (default: `4`) sets the width of tabs when checking an override's `maxLineLength`.
- `"overrides"` allows matching chains to use a different depth.

### ignoreChainWithDepth

Examples of **incorrect** code for this rule with the default `{ "ignoreChainWithDepth": 2 }` option:

::: incorrect

```js
/* eslint @stylistic/newline-per-chained-call: ["error", { "ignoreChainWithDepth": 2 }] */

_.chain({}).map(foo).filter(bar).value();

// Or
_.chain({}).map(foo).filter(bar);

// Or
_
  .chain({}).map(foo)
  .filter(bar);

// Or
obj.method().method2().method3();
```

:::

Examples of **correct** code for this rule with the default `{ "ignoreChainWithDepth": 2 }` option:

::: correct

```js
/* eslint @stylistic/newline-per-chained-call: ["error", { "ignoreChainWithDepth": 2 }] */

_
  .chain({})
  .map(foo)
  .filter(bar)
  .value();

// Or
_
  .chain({})
  .map(foo)
  .filter(bar);

// Or
_.chain({})
  .map(foo)
  .filter(bar);

// Or
obj
  .prop
  .method().prop;

// Or
obj
  .prop.method()
  .method2()
  .method3().prop;
```

:::

### overrides

Use `overrides` to allow a different chain depth for specific imports:

::: correct

```js
/* eslint @stylistic/newline-per-chained-call: ["error", {
    "ignoreChainWithDepth": 2,
    "tabWidth": 4,
    "overrides": [{
        "chainRoot": "select",
        "importedFrom": ["d3", "d3/*"],
        "maxLineLength": 120,
        "ignoreChainWithDepth": 5
    }]
}] */

import { select } from "d3";

const selection = select("body").selectAll("p").data([4, 8, 15]).enter();
```

:::

`chainRoot` is the identifier at the root of the chain, and `importedFrom` is where it can be imported from. Both can be a string or an array of strings.
When `treatDefaultAsNamespace` is set to `false`, matching a default imports is done using an empty string (`""`).
A trailing `/*` in `importedFrom` matches package subpaths. For example, `["d3", "d3/*"]` matches both `d3` and subpaths such as `d3/selection`.

The first matching override's `ignoreChainWithDepth` replaces the rule-level value.

When `maxLineLength` is set, the override only applies if the relevant source line is within that length.
Tabs are expanded according to `tabWidth`.

To match all chains solely based on their line length, omit both `chainRoot` and `importedFrom` and set `maxLineLength`.

## When Not To Use It

If you have conflicting rules or when you are fine with chained calls on one line, you can safely turn this rule off.
