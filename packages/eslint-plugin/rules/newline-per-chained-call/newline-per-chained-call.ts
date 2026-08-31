/**
 * @fileoverview Rule to ensure newline per method call when chaining calls
 * @author Rajendra Patil
 * @author Burak Yigit Kaya
 * @author Gilad S.
 */

import type { Scope, Tree } from '#types'
import type { MessageIds, RuleOptions } from './types'
import { getStaticPropertyName, isNotClosingParenToken, isTokenOnSameLine, LINEBREAK_MATCHER, skipChainExpression } from '#utils/ast'
import { createRule } from '#utils/create-rule'

export default createRule<RuleOptions, MessageIds>({
  name: 'newline-per-chained-call',
  meta: {
    type: 'layout',
    docs: {
      description: 'Require a newline after each call in a method chain',
    },
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      properties: {
        ignoreChainWithDepth: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
        },
        tabWidth: {
          type: 'integer',
          minimum: 0,
        },
        overrides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chainRoot: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                  },
                ],
              },
              importedFrom: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                  },
                ],
              },
              maxLineLength: {
                type: 'integer',
                minimum: 1,
              },
              ignoreChainWithDepth: {
                type: 'integer',
                minimum: 1,
                maximum: 10,
              },
            },
            required: ['chainRoot', 'importedFrom', 'ignoreChainWithDepth'],
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    }],
    defaultOptions: [{ ignoreChainWithDepth: 2, tabWidth: 4 }],
    messages: {
      expected: 'Expected line break before `{{callee}}`.',
    },
  },
  create(context, [options]) {
    const {
      ignoreChainWithDepth,
      overrides,
      tabWidth,
    } = options!

    const sourceCode = context.sourceCode

    interface ChainRoot {
      identifier: Tree.Identifier
      member: Tree.MemberExpression | null
    }

    /**
     * Get the prefix of a given MemberExpression node.
     * If the MemberExpression node is a computed value it returns a
     * left bracket. If not it returns a period.
     * @param node A MemberExpression node to get
     * @returns The prefix of the node.
     */
    function getPrefix(node: Tree.MemberExpression) {
      if (node.computed) {
        if (node.optional)
          return '?.['

        return '['
      }
      if (node.optional)
        return '?.'

      return '.'
    }

    /**
     * Gets the property text of a given MemberExpression node.
     * If the text is multiline, this returns only the first line.
     * @param node A MemberExpression node to get.
     * @returns The property text of the node.
     */
    function getPropertyText(node: Tree.MemberExpression) {
      const prefix = getPrefix(node)
      const lines = sourceCode.getText(node.property).split(LINEBREAK_MATCHER)
      const suffix = node.computed && lines.length === 1 ? ']' : ''

      return prefix + lines[0] + suffix
    }

    function getChainRoot(node: Tree.MemberExpression): ChainRoot | null {
      let current = skipChainExpression(node)
      let member: Tree.MemberExpression | null = null

      while (current.type === 'MemberExpression' || current.type === 'CallExpression') {
        if (current.type === 'MemberExpression')
          member = current

        current = skipChainExpression(current.type === 'MemberExpression' ? current.object : current.callee)
      }

      return current.type === 'Identifier'
        ? { identifier: current, member }
        : null
    }

    function getImportBinding(root: ChainRoot): { chainRoot: string, importedFrom: string } | null {
      let scope: Scope.Scope | null = sourceCode.getScope(root.identifier)

      while (scope) {
        const variable = scope.set.get(root.identifier.name)

        if (variable != null) {
          const definition = variable.defs.find(definition => definition.type === 'ImportBinding')

          if (definition?.parent.type !== 'ImportDeclaration')
            return null

          let chainRoot = ''

          if (definition.node.type === 'ImportSpecifier') {
            chainRoot = definition.node.imported.type === 'Identifier'
              ? definition.node.imported.name
              : definition.node.imported.value
          }
          else if (definition.node.type === 'ImportNamespaceSpecifier') {
            if (root.member == null)
              return null

            const namespaceChainRoot = getStaticPropertyName(root.member)
            if (namespaceChainRoot == null)
              return null

            chainRoot = namespaceChainRoot
          }

          return {
            chainRoot,
            importedFrom: definition.parent.source.value,
          }
        }

        scope = scope.upper
      }

      return null
    }

    function matchesValue(configured: string | string[], value: string): boolean {
      if (Array.isArray(configured))
        return configured.includes(value)

      return configured === value
    }

    function matchesImportSource(configured: string | string[], source: string): boolean {
      if (Array.isArray(configured))
        return configured.some(value => matchesImportSource(value, source))

      return configured.endsWith('/*')
        ? source.startsWith(configured.slice(0, -'*'.length))
        : source === configured
    }

    function computeLineLength(line: string): number {
      let extraCharacterCount = 0

      line.replace(/\t/gu, (_, offset) => {
        const totalOffset = offset + extraCharacterCount
        const previousTabStopOffset = tabWidth ? totalOffset % tabWidth : 0
        const spaceCount = tabWidth! - previousTabStopOffset

        extraCharacterCount += spaceCount - 1
        return ''
      })

      return Array.from(line).length + extraCharacterCount
    }

    function resolveOverride(callee: Tree.MemberExpression): number | undefined {
      if (overrides == null || overrides.length === 0)
        return undefined

      const root = getChainRoot(callee)
      if (root == null)
        return undefined

      const importBinding = getImportBinding(root)
      if (importBinding == null)
        return undefined

      for (const override of overrides) {
        if (!matchesValue(override.chainRoot, importBinding.chainRoot))
          continue
        else if (!matchesImportSource(override.importedFrom, importBinding.importedFrom))
          continue

        if (override.maxLineLength != null) {
          const line = sourceCode.lines[callee.property.loc.start.line - 1]

          if (computeLineLength(line) > override.maxLineLength)
            continue
        }

        return override.ignoreChainWithDepth
      }

      return undefined
    }

    return {
      'CallExpression:exit': function (node: Tree.CallExpression) {
        const callee = skipChainExpression(node.callee)

        if (callee.type !== 'MemberExpression')
          return

        let parent = skipChainExpression(callee.object)
        let depth = 1

        while (parent && 'callee' in parent && parent.callee) {
          depth += 1
          const parentCallee = skipChainExpression(parent.callee)
          if (!('object' in parentCallee))
            break
          parent = skipChainExpression(parentCallee.object)
        }

        const resolvedIgnoreChainWithDepth = resolveOverride(callee) ?? ignoreChainWithDepth!
        if (depth > resolvedIgnoreChainWithDepth && isTokenOnSameLine(callee.object, callee.property)) {
          const firstTokenAfterObject = sourceCode.getTokenAfter(callee.object, isNotClosingParenToken)!

          context.report({
            node: callee.property,
            loc: {
              start: firstTokenAfterObject.loc.start,
              end: callee.loc.end,
            },
            messageId: 'expected',
            data: {
              callee: getPropertyText(callee),
            },
            fix(fixer) {
              return fixer.insertTextBefore(firstTokenAfterObject, '\n')
            },
          })
        }
      },
    }
  },
})
