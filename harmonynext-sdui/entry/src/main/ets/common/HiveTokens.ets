// HiveTokens.ets
// HSBC Hive Design System tokens — HarmonyNext ArkTS

export namespace Hive {
  export namespace Color {
    export const brandPrimary: ResourceColor = '#C41230'
    export const brandGold: ResourceColor    = '#C9A84C'
    export const brandWhite: ResourceColor   = '#FFFFFF'
    export const n50: ResourceColor  = '#F8F8F8'
    export const n100: ResourceColor = '#F0F0F0'
    export const n200: ResourceColor = '#E5E5E5'
    export const n300: ResourceColor = '#CCCCCC'
    export const n400: ResourceColor = '#999999'
    export const n500: ResourceColor = '#666666'
    export const n600: ResourceColor = '#555555'
    export const n700: ResourceColor = '#333333'
    export const n800: ResourceColor = '#1A1A1A'
    export const n900: ResourceColor = '#0A0A0A'
    export const success: ResourceColor    = '#2D7D46'
    export const successLt: ResourceColor  = '#EFF7F2'
    export const error: ResourceColor      = '#CC0000'
    export const errorLt: ResourceColor    = '#FFEEEF'
    export const info: ResourceColor       = '#0055AA'
    export const infoLt: ResourceColor     = '#E8F0FE'
  }

  export namespace Typography {
    export const displayLarge: number  = 28
    export const headingXL: number     = 24
    export const headingMd: number     = 20
    export const headingSm: number     = 18
    export const labelBase: number     = 14
    export const bodyBase: number      = 15
    export const bodySm: number        = 13
    export const caption: number       = 12
  }

  export namespace Spacing {
    export const s1: number  = 4
    export const s2: number  = 8
    export const s3: number  = 12
    export const s4: number  = 16
    export const s5: number  = 20
    export const s6: number  = 24
    export const s7: number  = 28
    export const s8: number  = 32
  }

  export namespace Radius {
    export const sm: number   = 4
    export const base: number = 8
    export const md: number   = 12
    export const lg: number   = 16
    export const full: number = 999
  }

  export namespace Component {
    export namespace Input {
      export const height: number  = 52
      export const paddingH: number = 16
    }
    export namespace Button {
      export const height: number  = 52
      export const paddingH: number = 24
    }
  }
}
