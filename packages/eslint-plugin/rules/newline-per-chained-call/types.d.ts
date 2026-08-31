/* GENERATED, DO NOT EDIT DIRECTLY */

/* @checksum: Bz_3Ddi88HQYud0qPn2wl-cAj9kWUJOkUrNIQrV_Wng */

export interface NewlinePerChainedCallSchema0 {
  ignoreChainWithDepth?: number
  tabWidth?: number
  overrides?: {
    chainRoot: string | [string, ...string[]]
    importedFrom: string | [string, ...string[]]
    treatDefaultAsNamespace?: boolean
    maxLineLength?: number
    ignoreChainWithDepth: number
  }[]
}

export type NewlinePerChainedCallRuleOptions = [
  NewlinePerChainedCallSchema0?,
]

export type RuleOptions = NewlinePerChainedCallRuleOptions
export type MessageIds = 'expected'
