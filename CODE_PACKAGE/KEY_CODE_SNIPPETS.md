# Key Code Snippets - Quick Reference

This document contains the most important code snippets for quick reference.

---

## 1. Import Statement (Add to chat UI file)

```python
from local_resources import extract_zip_code, get_resources_by_zip, get_state_from_zip
```

---

## 2. Using the Resource Lookup

### Basic Usage
```python
# Extract ZIP code from user input
zip_code = extract_zip_code("I live in 90210")
# Returns: "90210"

# Get state from ZIP code
state = get_state_from_zip("90210")
# Returns: "CA"

# Get all resources for a ZIP code
resources = get_resources_by_zip("90210")
# Returns: Formatted string with all resources
```

### In Chat Flow (Lines 287-299 of seniorsafe_chat_ui_v3_logic.py)
```python
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
```

---

## 3. Federal Agencies Data Structure

```python
FEDERAL_AGENCIES = {
    "ic3": {
        "name": "FBI Internet Crime Complaint Center (IC3)",
        "phone": "1-800-CALL-FBI (1-800-225-5324)",
        "website": "www.ic3.gov",
        "description": "Report cybercrime and internet fraud"
    },
    "ftc": {
        "name": "Federal Trade Commission (FTC)",
        "phone": "1-877-FTC-HELP (1-877-382-4357)",
        "website": "www.ftc.gov/complaint",
        "description": "Report identity theft and consumer fraud"
    },
    "cfpb": {
        "name": "Consumer Financial Protection Bureau (CFPB)",
        "phone": "1-855-411-CFPB (1-855-411-2372)",
        "website": "www.consumerfinance.gov/complaint",
        "description": "Report financial fraud and banking issues"
    },
    "sec": {
        "name": "Securities and Exchange Commission (SEC)",
        "phone": "1-800-SEC-0330",
        "website": "www.sec.gov/tcr",
        "description": "Report investment fraud and securities violations"
    },
    "usss": {
        "name": "U.S. Secret Service",
        "phone": "202-406-5850",
        "website": "www.secretservice.gov",
        "description": "Report financial crimes and identity theft"
    },
    "doj": {
        "name": "Department of Justice (DOJ)",
        "phone": "202-514-2000",
        "website": "www.justice.gov/fraud",
        "description": "Report major fraud cases"
    }
}
```

---

## 4. State Resources Data Structure (Example: California)

```python
STATE_RESOURCES = {
    "CA": {
        "state": "California",
        "attorney_general": {
            "name": "California Attorney General's Office",
            "phone": "1-800-952-5225",
            "website": "www.oag.ca.gov"
        },
        "consumer_protection": {
            "name": "California Department of Consumer Affairs",
            "phone": "1-800-952-5210",
            "website": "www.dca.ca.gov"
        }
    },
    # ... all 50 states + DC follow same pattern
}
```

---

## 5. ZIP Code to State Mapping

```python
ZIP_TO_STATE = {
    # Examples:
    range(90000, 96200): "CA",   # California
    range(10000, 15000): "NY",   # New York
    range(60000, 63000): "IL",   # Illinois
    range(32000, 35000): "FL",   # Florida
    range(98000, 99500): "WA",   # Washington
    # ... complete mapping for all states
}
```

---

## 6. Core Functions

### extract_zip_code()
```python
def extract_zip_code(text):
    """
    Extract ZIP code from text using regex.
    Looks for 5-digit patterns.
    """
    zip_match = re.search(r'\b\d{5}\b', text)
    return zip_match.group(0) if zip_match else None
```

### get_state_from_zip()
```python
def get_state_from_zip(zip_code):
    """
    Get state abbreviation from ZIP code.
    Returns state code or None if not found.
    """
    if not zip_code or len(zip_code) != 5:
        return None

    try:
        zip_int = int(zip_code)
        for zip_range, state in ZIP_TO_STATE.items():
            if zip_int in zip_range:
                return state
    except ValueError:
        return None

    return None
```

### get_federal_resources()
```python
def get_federal_resources():
    """
    Get all federal agency resources.
    Returns formatted string with all federal agencies.
    """
    resources_text = "**Federal Agencies (Available Nationwide):**\n\n"

    for agency_id, agency in FEDERAL_AGENCIES.items():
        resources_text += f"• **{agency['name']}**\n"
        resources_text += f"  Phone: {agency['phone']}\n"
        resources_text += f"  Website: {agency['website']}\n"
        resources_text += f"  {agency['description']}\n\n"

    return resources_text
```

### get_state_resources()
```python
def get_state_resources(state_code):
    """
    Get state-specific resources for a given state code.
    Returns formatted string with state resources or None if not found.
    """
    if state_code not in STATE_RESOURCES:
        return None

    state_data = STATE_RESOURCES[state_code]
    resources_text = f"**{state_data['state']} State Resources:**\n\n"

    # Attorney General
    ag = state_data['attorney_general']
    resources_text += f"• **{ag['name']}**\n"
    resources_text += f"  Phone: {ag['phone']}\n"
    resources_text += f"  Website: {ag['website']}\n\n"

    # Consumer Protection
    cp = state_data['consumer_protection']
    resources_text += f"• **{cp['name']}**\n"
    resources_text += f"  Phone: {cp['phone']}\n"
    resources_text += f"  Website: {cp['website']}\n\n"

    return resources_text
```

### get_resources_by_zip() - MAIN FUNCTION
```python
def get_resources_by_zip(zip_code):
    """
    Main function to get all resources based on ZIP code.
    Returns formatted string with federal, state, and local resources.
    """
    if not zip_code:
        return get_general_resources()

    state_code = get_state_from_zip(zip_code)

    if not state_code:
        return get_general_resources()

    # Build comprehensive resource list
    resources_text = f"Based on your ZIP code ({zip_code}), here are your resources:\n\n"
    resources_text += "=" * 60 + "\n\n"

    # Add federal resources
    resources_text += get_federal_resources()
    resources_text += "=" * 60 + "\n\n"

    # Add state resources
    state_resources = get_state_resources(state_code)
    if state_resources:
        resources_text += state_resources
        resources_text += "=" * 60 + "\n\n"

    # Add local law enforcement info
    resources_text += get_local_law_enforcement_info(state_code)

    resources_text += "\n**Important:** Please report the incident to both federal agencies (like FBI IC3) AND your state/local authorities for the best chance of investigation and recovery.\n"

    return resources_text
```

---

## 7. Test Examples

```python
# Test ZIP extraction
assert extract_zip_code("My zip is 90210") == "90210"
assert extract_zip_code("I live in 10001") == "10001"
assert extract_zip_code("No zip here") == None

# Test state lookup
assert get_state_from_zip("90210") == "CA"
assert get_state_from_zip("10001") == "NY"
assert get_state_from_zip("60601") == "IL"

# Test full lookup
resources = get_resources_by_zip("90210")
assert "FBI Internet Crime Complaint Center" in resources
assert "California" in resources
assert "Attorney General" in resources
```

---

## 8. Complete State List (Abbreviations)

All 50 states + DC are included:
```
AL - Alabama          AK - Alaska           AZ - Arizona
AR - Arkansas         CA - California       CO - Colorado
CT - Connecticut      DE - Delaware         DC - District of Columbia
FL - Florida          GA - Georgia          HI - Hawaii
ID - Idaho            IL - Illinois         IN - Indiana
IA - Iowa             KS - Kansas           KY - Kentucky
LA - Louisiana        ME - Maine            MD - Maryland
MA - Massachusetts    MI - Michigan         MN - Minnesota
MS - Mississippi      MO - Missouri         MT - Montana
NE - Nebraska         NV - Nevada           NH - New Hampshire
NJ - New Jersey       NM - New Mexico       NY - New York
NC - North Carolina   ND - North Dakota     OH - Ohio
OK - Oklahoma         OR - Oregon           PA - Pennsylvania
RI - Rhode Island     SC - South Carolina   SD - South Dakota
TN - Tennessee        TX - Texas            UT - Utah
VT - Vermont          VA - Virginia         WA - Washington
WV - West Virginia    WI - Wisconsin        WY - Wyoming
```

---

## 9. File Organization

```
Seniorsafe_LD/
├── local_resources.py          # Main module (import from here)
├── seniorsafe_chat_ui_v3_logic.py  # Updated to use new module
├── test_resources.py           # Test suite
└── demo_resources.py           # Demo/examples
```

---

## 10. Quick Start

### Step 1: Import
```python
from local_resources import extract_zip_code, get_resources_by_zip, get_state_from_zip
```

### Step 2: Use in your code
```python
# User says: "I live in 90210"
user_input = "I live in 90210"

# Extract ZIP
zip_code = extract_zip_code(user_input)  # "90210"

# Get state
state = get_state_from_zip(zip_code)  # "CA"

# Get resources
resources = get_resources_by_zip(zip_code)

# Show to user
print(f"You're in {state}!")
print(resources)
```

---

**That's it! The system automatically handles all 50 states + DC with just these simple function calls.**
