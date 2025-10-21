import 'dotenv/config'
import { NodeSDK } from "@opentelemetry/sdk-node"
import { LangfuseSpanProcessor } from "@langfuse/otel"
import { LangfuseClient } from "@langfuse/client"
import { CallbackHandler } from "@langfuse/langchain"
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

const sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
})

sdk.start()
const langfuse = new LangfuseClient()
const langfuseHandler = new CallbackHandler()
const consoleHandler = new ConsoleCallbackHandler()

const langfuseChatPrompt = await langfuse.prompt.get("test", { type: "chat" })

const langchainChatPrompt = ChatPromptTemplate.fromMessages(
    langfuseChatPrompt.getLangchainPrompt().map((m) => [m.role, m.content]),
).withConfig({
    metadata: { langfuse_prompt: langfuseChatPrompt },
})

const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-pro" })

const chain = langchainChatPrompt.pipe(model)

const params = { message: "Hi!" }

const result = await chain.invoke(params, {
    callbacks: [langfuseHandler, consoleHandler],
})

console.log(result)
langfuse.shutdown()
sdk.shutdown()