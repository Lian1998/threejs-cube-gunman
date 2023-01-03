/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}


// 需要vite额外进行引用识别的

declare module '*.vert' {
    export default string
}


declare module '*.frag' {
    export default string
}
