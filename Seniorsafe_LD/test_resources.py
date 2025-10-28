"""
Test script for local resources lookup functionality
"""

from local_resources import (
    extract_zip_code,
    get_state_from_zip,
    get_resources_by_zip,
    get_federal_resources,
    get_state_resources
)


def test_zip_extraction():
    """Test ZIP code extraction from text"""
    print("=" * 60)
    print("Testing ZIP code extraction...")
    print("=" * 60)

    test_cases = [
        ("My zip code is 33618", "33618"),
        ("I live in 90210", "90210"),
        ("10001 is my zip", "10001"),
        ("No zip here", None),
        ("12345", "12345")
    ]

    for text, expected in test_cases:
        result = extract_zip_code(text)
        status = "✓" if result == expected else "✗"
        print(f"{status} Text: '{text}' -> Expected: {expected}, Got: {result}")

    print()


def test_state_lookup():
    """Test state lookup from ZIP codes"""
    print("=" * 60)
    print("Testing state lookup from ZIP codes...")
    print("=" * 60)

    test_cases = [
        ("33618", "FL"),  # Florida
        ("90210", "CA"),  # California
        ("10001", "NY"),  # New York
        ("60601", "IL"),  # Illinois
        ("98101", "WA"),  # Washington
        ("02101", "MA"),  # Massachusetts
        ("78701", "TX"),  # Texas
        ("20001", "DC"),  # District of Columbia
        ("99501", "AK"),  # Alaska
        ("96801", "HI"),  # Hawaii
    ]

    for zip_code, expected_state in test_cases:
        result = get_state_from_zip(zip_code)
        status = "✓" if result == expected_state else "✗"
        print(f"{status} ZIP: {zip_code} -> Expected: {expected_state}, Got: {result}")

    print()


def test_federal_resources():
    """Test federal resources retrieval"""
    print("=" * 60)
    print("Testing federal resources retrieval...")
    print("=" * 60)

    resources = get_federal_resources()

    # Check that all 6 federal agencies are present
    required_agencies = [
        "FBI Internet Crime Complaint Center",
        "Federal Trade Commission",
        "Consumer Financial Protection Bureau",
        "Securities and Exchange Commission",
        "U.S. Secret Service",
        "Department of Justice"
    ]

    for agency in required_agencies:
        if agency in resources:
            print(f"✓ {agency} found in federal resources")
        else:
            print(f"✗ {agency} NOT found in federal resources")

    print()


def test_state_resources():
    """Test state-specific resources"""
    print("=" * 60)
    print("Testing state-specific resources...")
    print("=" * 60)

    test_states = ["FL", "CA", "NY", "TX", "DC"]

    for state in test_states:
        resources = get_state_resources(state)
        if resources and "Attorney General" in resources and "Consumer Protection" in resources:
            print(f"✓ {state} resources retrieved successfully")
        else:
            print(f"✗ {state} resources incomplete or missing")

    print()


def test_full_lookup():
    """Test full resource lookup by ZIP code"""
    print("=" * 60)
    print("Testing full resource lookup...")
    print("=" * 60)

    test_zips = ["33618", "90210", "10001", "20001"]

    for zip_code in test_zips:
        print(f"\nTesting ZIP: {zip_code}")
        print("-" * 60)
        resources = get_resources_by_zip(zip_code)

        # Check for key components
        has_federal = "Federal Agencies" in resources
        has_state = "State Resources" in resources or "state" in resources.lower()
        has_local = "Local Law Enforcement" in resources or "local" in resources.lower()

        print(f"  Federal agencies: {'✓' if has_federal else '✗'}")
        print(f"  State resources: {'✓' if has_state else '✗'}")
        print(f"  Local info: {'✓' if has_local else '✗'}")

        if has_federal and has_state and has_local:
            print(f"  Overall: ✓ Complete resource package")
        else:
            print(f"  Overall: ✗ Incomplete resource package")

    print()


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("LOCAL RESOURCES LOOKUP - TEST SUITE")
    print("=" * 60 + "\n")

    test_zip_extraction()
    test_state_lookup()
    test_federal_resources()
    test_state_resources()
    test_full_lookup()

    print("=" * 60)
    print("TEST SUITE COMPLETED")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
