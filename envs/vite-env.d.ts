/// <reference types="vite/client" />

declare module '*.glsl' {
    export default string
}

declare module '*.vert' {
    export default string
}

declare module '*.frag' {
    export default string
}

interface ImportMetaEnv {
    readonly VITE_PUBLIC_ROOT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}