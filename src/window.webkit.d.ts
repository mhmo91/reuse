interface CallbackHandler {
	postMessage(message: string): void
}

interface MessageHandlers {
	callbackHandler: CallbackHandler
}

interface Webkit {
	messageHandlers: MessageHandlers
}

interface Window {
	webkit: Webkit
}
