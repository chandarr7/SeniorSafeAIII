from langchain_community.llms import Ollama
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable import Runnable
from langchain.schema.runnable.config import RunnableConfig
from langchain.memory import ConversationBufferMemory
import chainlit as cl
import re
from local_resources import extract_zip_code, get_resources_by_zip, get_state_from_zip

# --- Additional Detailed Functions ---

def get_detailed_steps(scam_type: str) -> str:
    """Returns detailed explanations of immediate actions based on scam type"""
    if scam_type == "fake tech support scam":
        return """Let me explain each step in more detail:

1. Disconnect from internet:
   - Turn off your Wi-Fi or unplug your ethernet cable
   - This prevents scammers from maintaining remote access

2. Shut down computer:
   - This terminates any active remote sessions
   - Forces all current connections to close

3. Run security scan:
   - Use reputable antivirus software like Windows Defender, Norton, or McAfee
   - Perform a full system scan, not just a quick scan

4. Check for malware:
   - Look for any new programs you didn't install
   - Check your installed programs list for unfamiliar software
   - Remove any suspicious programs

5. Change passwords:
   - Use a different device to change passwords
   - Start with email and banking passwords
   - Create strong, unique passwords

6. Enable two-factor authentication:
   - Set up on email accounts
   - Enable for banking and financial accounts
   - Use an authenticator app if possible

7. Contact your bank:
   - Report any unauthorized charges
   - Ask them to monitor for suspicious activity

8. Monitor accounts:
   - Check bank statements regularly
   - Watch for unexpected charges
   - Review account login history

Would you like me to clarify any of these steps further?"""
    else:
        return get_immediate_actions(scam_type)

def get_detailed_recommendations() -> str:
    """Returns detailed cybersecurity recommendations"""
    return """Based on your responses, we have some recommendations to lower your chances of being a victim again:

1. Firewall Protection:
   - Make sure your computer's firewall is enabled at all times
   - Check firewall settings regularly in your computer's security settings
   - Consider using additional firewall software for extra protection

2. System Monitoring:
   - Regularly check your computer's performance and resource usage
   - Watch for unusual spikes in CPU or network activity
   - Keep track of what programs are running on your computer
   - Monitor your system for unexpected changes or new programs

3. User Account Security:
   - Change your administrator username to something unique
   - Create a separate account for daily use (not administrator)
   - Use different usernames for different devices and services
   - Never share administrator credentials with anyone

4. Password Security:
   - Use strong, unique passwords for each account
   - Consider using a password manager instead of browser autofill
   - Change passwords regularly, not just yearly
   - Never save passwords in your browser
   - Enable two-factor authentication when available

Have you reported this incident to any authorities yet?"""

def get_risk_explanation(scam_type: str) -> str:
    """Returns an explanation of risks based on scam type"""
    risks = {
        "fake tech support scam": """If you were scammed by fake tech support, it's possible that the scammers installed harmful software on your computer, commonly known as malware. This could include keyloggers, which record your keystrokes to capture passwords and personal information, or other types of malicious software designed to steal data or compromise your system's security.

If you granted them remote access, they might have taken the opportunity to install these programs without your knowledge. To protect yourself, it's crucial to run a complete scan with a reputable antivirus or anti-malware program to identify and remove any harmful software. If the scan reveals issues or if you are unsure, it may be wise to consult a trusted technician for further assistance to ensure your device is safe and secure.

Do you think they currently have access to your device?""",
        "identity theft": """When someone steals your identity, they can potentially use your personal information to:
1. Open new credit accounts or loans in your name
2. Access your existing financial accounts
3. File fraudulent tax returns
4. Obtain medical services using your insurance
5. Create fake government documents

It's important to act quickly to prevent further damage. Have you noticed any suspicious activity on your accounts?""",
        "financial fraud": """Financial fraud can have serious consequences. The scammers might:
1. Make unauthorized charges on your accounts
2. Transfer money without your permission
3. Open new accounts in your name
4. Use your information for other fraudulent activities

Have you noticed any unauthorized transactions or suspicious activity?""",
        "romance scam": """Romance scammers often try to:
1. Gain access to your financial accounts
2. Request money for emergencies or travel
3. Ask for gift cards or wire transfers
4. Collect personal information for identity theft
5. Use emotional manipulation to continue getting money

Have you shared any financial information or sent them any money?""",
        "cryptocurrency investment scam": """Cryptocurrency investment scams can be very sophisticated. The scammers might:
1. Create fake investment platforms
2. Show false profits to encourage more investment
3. Steal your cryptocurrency wallet credentials
4. Use your personal information for identity theft
5. Pressure you to recruit others into the scheme

Have you invested any money or shared access to your cryptocurrency accounts?"""
    }
    return risks.get(scam_type, """Online scams can have various risks including financial loss, identity theft, and unauthorized access to your accounts. Have you noticed any suspicious activity or unauthorized access?""")

# --- Main Chatbot Code ---

@cl.on_chat_start
async def on_chat_start():
    # Send welcome message
    welcome_msg = """Welcome to SeniorSafe AI. I'm here to help if you've experienced an online scam or cybercrime.

How can I assist you today? Please tell me about what happened, and I'll guide you through the next steps."""
    await cl.Message(content=welcome_msg).send()

    model = Ollama(model="llama3.1")
    system_prompt = """You are a compassionate cybercrime support specialist trained to help victims of online scams. Follow these guidelines:

1. Start by asking for details about what happened
2. Show empathy and understanding
3. Identify the type of scam accurately
4. Provide step-by-step guidance
5. Offer emotional support
6. Share preventive measures
7. Provide relevant reporting resources

Always maintain a conversational, supportive tone and follow up with relevant questions based on the user's responses.
"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{question}"),
    ])
    runnable = prompt | model | StrOutputParser()
    cl.user_session.set("runnable", runnable)
    cl.user_session.set("chat_step", "waiting_for_incident")
    cl.user_session.set("memory", ConversationBufferMemory())
    cl.user_session.set("scam_type", None)
    cl.user_session.set("zip_code", None)

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

@cl.on_message
async def on_message(message: cl.Message):
    chat_step = cl.user_session.get("chat_step")
    memory = cl.user_session.get("memory")

    # (We no longer check for zip code early.)
    
    # Process message based on chat step
    if chat_step == "waiting_for_incident":
        response = ("Hi. I hear that you may have a problem that you need help with. "
                    "Could you please tell me what happened with as much detail as possible "
                    "and when it occurred so that I can best assist you in this situation?")
        cl.user_session.set("chat_step", "collecting_details")
    
    elif chat_step == "collecting_details":
        scam_type = identify_scam_type(message.content)
        cl.user_session.set("scam_type", scam_type)
        response = "I hear you. What about this incident led you to suspect that something is wrong or that it is a scam?"
        cl.user_session.set("chat_step", "confirming_scam")
    
    elif chat_step == "confirming_scam":
        scam_type = cl.user_session.get("scam_type")
        response = get_scam_confirmation(scam_type)
        cl.user_session.set("chat_step", "checking_contact")
    
    elif chat_step == "checking_contact":
        response = "Did you click on any links or contact the scammer?"
        cl.user_session.set("chat_step", "checking_access")
    
    elif chat_step == "checking_access":
        response = ("I am sure that was a difficult situation to navigate. "
                    "Do you believe or have signs that the individual was able to gain access to your laptop?")
        cl.user_session.set("chat_step", "explaining_risks")
    
    elif chat_step == "explaining_risks":
        scam_type = cl.user_session.get("scam_type")
        if "how" in message.content.lower() or "what" in message.content.lower():
            response = get_risk_explanation(scam_type)
            cl.user_session.set("chat_step", "providing_immediate_actions")
        else:
            response = get_immediate_actions(scam_type)
            cl.user_session.set("chat_step", "checking_steps_completed")
    
    elif chat_step == "providing_immediate_actions":
        response = get_immediate_actions(cl.user_session.get("scam_type"))
        cl.user_session.set("chat_step", "checking_steps_completed")
    
    elif chat_step == "checking_steps_completed":
        # After immediate actions, decide next step based on scam type.
        if cl.user_session.get("scam_type") == "fake tech support scam":
            # Initiate prevention Q&A sequence for fake tech support scams.
            prevention_qs = [
                "First, do you check to see if the firewalls on your computer are enabled?",
                "Do you monitor different processes like CPU, power, or network usage on your device?",
                "Do you change the default username from administrator to something unique on your Internet-enabled devices?",
                "Have you changed default passwords on all Internet-enabled devices?",
                "Do you have your internet browser automatically saving your login information for any of your online accounts?"
            ]
            cl.user_session.set("prevention_qs", prevention_qs)
            cl.user_session.set("prevention_index", 0)
            response = ("I know this is a really stressful situation, but I want you to know that everything is going to be okay. "
                        "You are not the first person to fall for a tech support scam, and you definitely won’t be the last. "
                        "These scammers are incredibly skilled at making people panic and act quickly—it doesn’t mean you did anything wrong. "
                        "We are going to ask some questions to help protect you from future scams.")
            cl.user_session.set("chat_step", "asking_prevention_questions")
        else:
            # For other scam types, move directly to asking if they've reported the incident.
            response = "Have you reported this incident to any authorities yet?"
            cl.user_session.set("chat_step", "asking_report")
    
    elif chat_step == "asking_prevention_questions":
        prevention_qs = cl.user_session.get("prevention_qs")
        index = cl.user_session.get("prevention_index")
        if index is not None and index < len(prevention_qs):
            response = prevention_qs[index]
            cl.user_session.set("prevention_index", index + 1)
            cl.user_session.set("chat_step", "asking_prevention_questions")
        else:
            # After all prevention questions, provide recommendations and ask if reported.
            response = ("""Based on your responses, here are some recommendations to lower your chances of being a victim again:
1. Regularly check to ensure that firewalls on your computer are enabled.
2. Monitor processes like CPU, power, and network usage to catch any suspicious activity.
3. Change the default administrator username to something unique.
4. Avoid saving passwords and using browser autofill for online accounts.

Have you reported this incident to any authorities yet?""")
            cl.user_session.set("chat_step", "asking_report")
    
    elif chat_step == "asking_report":
        # Ask for the reporting status.
        response = "Have you reported this incident to any authorities yet? (For example, 'Yes, I have' or 'No, I haven't')"
        cl.user_session.set("chat_step", "awaiting_report")
    
    elif chat_step == "awaiting_report":
        # Accept the user's answer about reporting and then ask for their zip code.
        response = "What is your current zip code, so I can provide you with local reporting resources?"
        cl.user_session.set("chat_step", "asking_zip")
    
    elif chat_step == "asking_zip":
        zip_code = extract_zip_code(message.content)
        if zip_code:
            cl.user_session.set("zip_code", zip_code)
            state = get_state_from_zip(zip_code)
            if state:
                response = f"Thank you. I've identified that you're in {state}.\n\n" + get_resources_by_zip(zip_code)
            else:
                response = get_resources_by_zip(zip_code)
            cl.user_session.set("chat_step", "awaiting_followup")
        else:
            response = "Could you please provide your 5-digit ZIP code?"
            cl.user_session.set("chat_step", "asking_zip")
    
    elif chat_step == "awaiting_followup":
        response = "Is there anything else I can help you with?"
        cl.user_session.set("chat_step", "waiting_for_incident")
    
    else:
        response = "Let's start over. Could you please tell me what happened?"
        cl.user_session.set("chat_step", "collecting_details")
    
    memory.save_context({"input": message.content}, {"output": response})
    await cl.Message(content=response).send()

def identify_scam_type(message: str) -> str:
    """Identifies the type of scam based on user input"""
    message = message.lower()
    # Romance Scams
    if any(word in message for word in [
        "romance", "relationship", "dating", "love", "marriage", "partner",
        "online dating", "girlfriend", "boyfriend", "widow", "widower",
        "military", "overseas", "deployment", "travel money", "emergency funds",
        "send money", "meet in person", "video chat", "dating site", "social media",
        "tinder", "match.com", "facebook dating", "bumble", "hinge", "date",
        "profile", "match", "before meeting", "before date"
    ]):
        return "romance scam"
    # Investment & Crypto Scams
    elif any(word in message for word in [
        "crypto", "bitcoin", "investment", "cheap", "quick profit", "trading",
        "guaranteed return", "incredible gains", "cant miss", "risk free",
        "quick money", "high return", "urgent investment", "limited time offer",
        "cryptocurrency", "trading platform", "broker", "stock", "forex"
    ]):
        return "cryptocurrency investment scam"
    # Tech Support Scams
    elif any(word in message for word in [
        "pop-up", "tech support", "virus", "computer", "microsoft support",
        "security warning", "system alert", "infected", "malware", "remote access",
        "error message", "security scan", "diagnostic", "system fix", "antivirus",
        "technical support", "computer warning", "mcafee", "norton", "windows security"
    ]):
        return "fake tech support scam"
    # Identity Theft
    elif any(word in message for word in [
        "identity", "personal information", "stolen", "social security",
        "ssn", "medicare", "insurance claim", "tax return", "credit report",
        "unauthorized account", "identity fraud", "stolen documents", "fake account",
        "passport", "drivers license", "government id", "medical records"
    ]):
        return "identity theft"
    # Financial Fraud
    elif any(word in message for word in [
        "bank", "credit card", "money", "unauthorized charge", "transaction",
        "wire transfer", "payment", "account access", "debit card", "gift card",
        "western union", "moneygram", "bank transfer", "withdrawal", "deposit",
        "loan", "mortgage", "credit line", "overdraft", "financial institution"
    ]):
        return "financial fraud"
    else:
        return "potential online scam"

def get_scam_confirmation(scam_type: str) -> str:
    """Returns a confirmation message based on scam type"""
    scam_descriptions = {
        "cryptocurrency investment scam": """I am sorry to hear that. It sounds like you've encountered a cryptocurrency investment scam. These scams often promise unrealistic returns or extremely low prices for cryptocurrency. Legitimate cryptocurrency transactions don't offer such steep discounts - if it sounds too good to be true, it usually is. Can you confirm if this matches your situation?""",
        "fake tech support scam": """I am sorry to hear that. It sounds like you may have experienced a fake tech support scam. These scammers often use pop-ups or unsolicited calls claiming your computer is infected. Can you confirm if this sounds like what happened?""",
        "identity theft": """I am sorry to hear that. It sounds like you may have experienced identity theft. This is when someone uses your personal information without permission. Can you confirm if this sounds like what happened?""",
        "financial fraud": """I am sorry to hear that. It sounds like you may have experienced financial fraud. This often involves unauthorized access to your financial accounts or fraudulent charges. Can you confirm if this sounds like what happened?""",
        "romance scam": """I am sorry to hear that. It sounds like you may have experienced a romance scam. These scammers often build relationships online before asking for money. Can you confirm if this sounds like what happened?""",
        "potential online scam": """I am sorry to hear that. It sounds like you may have experienced an online scam. Can you provide more details about what happened so I can better assist you?"""
    }
    return scam_descriptions.get(scam_type, scam_descriptions["potential online scam"])

def get_immediate_actions(scam_type: str) -> str:
    """Returns immediate actions based on scam type"""
    actions = {
        "cryptocurrency investment scam": """Here are the immediate steps you should take:
1. Stop any further cryptocurrency transactions immediately
2. Document all communications with the scammer
3. Take screenshots of any investment platforms or websites involved
4. Contact your bank if you used a credit card or bank transfer
5. Change all passwords for your cryptocurrency wallets and exchanges
6. Enable two-factor authentication on all your accounts
7. Report to the SEC and FBI's Internet Crime Complaint Center (IC3)

Would you like me to explain any of these steps in more detail?""",
        "fake tech support scam": """Here are the immediate steps you should take:
1. Disconnect your internet connection immediately to stop their access
2. Shut down your computer to terminate any remote sessions
3. Run a thorough security scan using reputable antivirus software
4. Check for any malware or unauthorized software they may have installed
5. Change passwords for sensitive accounts from a secure device
6. Enable two-factor authentication where available
7. Contact your bank if you made any payments
8. Monitor your accounts for suspicious activity

Would you like me to explain any of these steps in more detail?""",
        "identity theft": """Here are the immediate steps you should take:
1. Contact credit bureaus (Equifax, Experian, TransUnion) to place a fraud alert
2. Get your credit reports and review for unauthorized accounts
3. File a report at IdentityTheft.gov
4. Contact your banks and credit card companies
5. Change all passwords and enable two-factor authentication
6. File a police report and keep a copy for your records
7. Contact the Social Security Administration if your SSN was compromised
8. Monitor your credit reports and financial statements closely

Would you like me to explain any of these steps in more detail?""",
        "financial fraud": """Here are the immediate steps you should take:
1. Contact your bank and credit card companies immediately
2. Report unauthorized transactions and request account freezes
3. Change all online banking passwords
4. Enable two-factor authentication for all financial accounts
5. Review recent statements for unauthorized charges
6. Contact credit bureaus to place a fraud alert
7. Document all fraudulent transactions
8. File a report with the FBI's Internet Crime Complaint Center (IC3)

Would you like me to explain any of these steps in more detail?""",
        "romance scam": """Here are the immediate steps you should take:
1. Stop all communication with the scammer immediately
2. Block them on all platforms (dating sites, social media, phone)
3. Document all communications and save any evidence
4. Contact your bank if you sent them money
5. Report their profile to the dating platform or social media site
6. Change passwords for any accounts they might know about
7. Enable two-factor authentication on all accounts
8. File a report with the FBI's Internet Crime Complaint Center (IC3)
9. Be wary of follow-up scams claiming to help recover your money

Would you like me to explain any of these steps in more detail?""",
        "potential online scam": """Here are the immediate steps you should take:
1. Stop any further communication or transactions
2. Document everything that happened
3. Contact your bank if any financial information was shared
4. Change passwords for any potentially compromised accounts
5. Enable two-factor authentication where available
6. Report the incident to the FBI's Internet Crime Complaint Center (IC3)
7. Monitor your accounts for suspicious activity

Would you like me to explain any of these steps in more detail?"""
    }
    return actions.get(scam_type, actions["potential online scam"])


def get_prevention_tips(scam_type: str) -> str:
    """Returns prevention tips based on scam type"""
    if scam_type == "cryptocurrency investment scam":
        return """To protect yourself from cryptocurrency scams in the future:
1. Be extremely wary of unsolicited investment opportunities
2. Research thoroughly before investing in any cryptocurrency
3. Don't trust promises of guaranteed returns or unrealistic profits
4. Only use well-known, legitimate cryptocurrency exchanges
5. Never share your private keys or wallet information
6. Be skeptical of pressure to act quickly or "limited time" offers"""
    else:
        return """To protect yourself from online scams in the future:
1. Be cautious of unsolicited contacts and offers
2. Never share sensitive information unless you're certain of the recipient
3. Use strong, unique passwords for all accounts
4. Enable two-factor authentication wherever possible
5. Regularly monitor your accounts for suspicious activity
6. Keep your software and security systems updated"""
