declare namespace JSX {
  interface IntrinsicElements {
    'micro-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      name?: string
      url?: string
      baseroute?: string
      iframe?: boolean
      inline?: boolean
    }
  }
}
