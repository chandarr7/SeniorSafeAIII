from langchain_community.llms import Ollama
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable import Runnable
from langchain.schema.runnable.config import RunnableConfig

import chainlit as cl

@cl.set_starters
async def set_starters():
    return [
    	cl.Starter(
        	label="Identity Stolen",
        	message="What should I do if my identity has been stolen in an online scam?",
        	icon="/public/identity_theft.png",
    ),
    	cl.Starter(
        	label="Financial Loss",
        	message="How can I recover money lost to a scammer?",
        	icon="/public/financial_loss.png",
    ),
    	cl.Starter(
        	label="Protecting Accounts",
        	message="How can I protect my bank accounts after being scammed?",
        	icon="/public/protect_accounts.png",
    ),
    	cl.Starter(
        	label="Reporting a Scam",
        	message="Who should I report a cyber scam to?",
        	icon="/public/report_scam.png",
        )
    ]

@cl.on_chat_start
async def on_chat_start():
    model = Ollama(model="mistral") ## default
#    model = Ollama(model="medical_mistral") ## this is my custom model
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a knowledgeable and honest assistant to provide reliable and up-to-date advice on what to do when the user is a victim of a cybercrime.",
            ),
            ("human", "{question}"),
        ]
    )
    runnable = prompt | model | StrOutputParser()
    cl.user_session.set("runnable", runnable)


@cl.on_message
async def on_message(message: cl.Message):
    runnable = cl.user_session.get("runnable")  # type: Runnable

    msg = cl.Message(content="")

    async for chunk in runnable.astream(
        {"question": message.content},
        config=RunnableConfig(callbacks=[cl.LangchainCallbackHandler()]),
    ):
        await msg.stream_token(chunk)

    await msg.send()
