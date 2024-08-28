from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain_community.llms import Ollama
from langchain_community.chat_models import ChatOllama
from langchain.memory import ChatMessageHistory, ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable import Runnable
from langchain.schema.runnable.config import RunnableConfig
import chainlit as cl

# Function to load the prebuilt Chroma vector store
def load_prebuilt_vector_store():
    embeddings = OllamaEmbeddings(model="mistral")
    vector_store = Chroma(
        persist_directory="./pdf_training", embedding_function=embeddings
    )
    return vector_store

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
    # Load the prebuilt Chroma vector store
    docsearch = load_prebuilt_vector_store()

    # Set up chat message history and memory
    message_history = ChatMessageHistory()
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        output_key="answer",
        chat_memory=message_history,
        return_messages=True,
    )

    # Create a Conversational Retrieval Chain with the prebuilt vector store and model
    chain = ConversationalRetrievalChain.from_llm(
        ChatOllama(model="mistral"),
        chain_type="stuff",
        retriever=docsearch.as_retriever(),
        memory=memory,
        return_source_documents=True,
    )

    # Store the chain in the user session
    cl.user_session.set("chain", chain)

    # General chat model for non-PDF related questions
    general_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a knowledgeable and honest assistant to provide reliable and up-to-date information for user who is a victim of a cyber crime."),
            ("human", "{question}"),
        ]
    )
    general_runnable = general_prompt | ChatOllama(model="mistral") | StrOutputParser()

    # Store the general chat model
  #  cl.user_session.set("general_runnable", general_runnable)

  #  await cl.Message(content="Welcome to SeniorSafe ai. The system is fully loaded. You can now ask questions!").send()

@cl.on_message
async def on_message(message: cl.Message):
    # Retrieve the stored Conversational Retrieval Chain
    chain = cl.user_session.get("chain")  # type: ConversationalRetrievalChain
    general_runnable = cl.user_session.get("general_runnable")  # type: Runnable

    # Handle the user message and try to retrieve documents
    cb = cl.AsyncLangchainCallbackHandler()
    res = await chain.ainvoke(message.content, callbacks=[cb])

    # Check if there are source documents
    source_documents = res.get("source_documents", [])  # type: List[Document]

    # Filter out empty or irrelevant documents
    meaningful_documents = [
        doc for doc in source_documents if doc.page_content.strip()
    ]

    if meaningful_documents:
        # If there are meaningful source documents, provide an answer based on the PDFs
        answer = res["answer"]
        text_elements = [
            cl.Text(content=doc.page_content, name=f"source_{i}")
            for i, doc in enumerate(meaningful_documents)
        ]
        source_names = [text_el.name for text_el in text_elements]
        answer += f"\nSources: {', '.join(source_names)}"
    else:
        # If no meaningful source documents are found, fall back to the general model
        print("Fallback: No relevant documents found, using the general model.")
        answer = ""
        async for chunk in general_runnable.astream(
            {"question": message.content},
            config=RunnableConfig(callbacks=[cl.LangchainCallbackHandler()]),
        ):
            answer += chunk

    # Send the final response with or without sources
    await cl.Message(content=answer).send()
