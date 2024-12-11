declare module '*.scss?inline' {
	import { type CSSResult } from 'lit'
	const styles: CSSResult
	export default styles
}

declare module '*.module.scss' {
	const classes: Record<string, string>
	export default classes
}
