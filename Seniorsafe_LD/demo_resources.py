"""
Demo script to show resource lookup output for different ZIP codes
"""

from local_resources import get_resources_by_zip


def demo_resource_lookup():
    """Demonstrate resource lookup for various ZIP codes"""

    demo_zips = [
        ("33618", "Tampa, Florida"),
        ("90210", "Beverly Hills, California"),
        ("10001", "New York, New York"),
        ("60601", "Chicago, Illinois"),
        ("20001", "Washington, DC"),
        ("98101", "Seattle, Washington"),
    ]

    print("\n" + "=" * 80)
    print("AUTOMATIC LOCAL RESOURCE LOOKUP DEMONSTRATION")
    print("=" * 80 + "\n")

    for zip_code, location in demo_zips:
        print(f"\n{'=' * 80}")
        print(f"Location: {location} (ZIP: {zip_code})")
        print("=" * 80)
        print(get_resources_by_zip(zip_code))
        print("\n")

    print("=" * 80)
    print("DEMONSTRATION COMPLETED")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    demo_resource_lookup()
