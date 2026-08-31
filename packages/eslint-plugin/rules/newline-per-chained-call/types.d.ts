/* GENERATED, DO NOT EDIT DIRECTLY */

/* @checksum: ukGyh3-u7rpIacroyk1sCMH20ibxo-KB3bN9MiNP9nQ */

export interface NewlinePerChainedCallSchema0 {
  ignoreChainWithDepth?: number
  tabWidth?: number
  overrides?: (
    | {
      chainRoot: string | [string, ...string[]]
      importedFrom: string | [string, ...string[]]
      treatDefaultAsNamespace?: boolean
      maxLineLength?: number
      ignoreChainWithDepth: number
    }
    | {
      maxLineLength: number
      ignoreChainWithDepth: number
    }
  )[]
}

export type NewlinePerChainedCallRuleOptions = [
  NewlinePerChainedCallSchema0?,
]

export type RuleOptions = NewlinePerChainedCallRuleOptions
export type MessageIds = 'expected'
