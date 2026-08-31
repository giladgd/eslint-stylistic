/* GENERATED, DO NOT EDIT DIRECTLY */

/* @checksum: Wve6MztGdL2Vcy_6qM0jbj1Ync1QXANKFKzt0aaaNFE */

export interface NewlinePerChainedCallSchema0 {
  ignoreChainWithDepth?: number
  tabWidth?: number
  overrides?: {
    chainRoot: string | [string, ...string[]]
    importedFrom: string | [string, ...string[]]
    ignoreChainWithDepth: number
    maxLineLength?: number
  }[]
}

export type NewlinePerChainedCallRuleOptions = [
  NewlinePerChainedCallSchema0?,
]

export type RuleOptions = NewlinePerChainedCallRuleOptions
export type MessageIds = 'expected'
