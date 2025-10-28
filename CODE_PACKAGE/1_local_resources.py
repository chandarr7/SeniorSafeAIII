"""
Local Resources Lookup System
Provides ZIP code-based resource finder for all 50 states + DC
Includes federal agencies and state-specific offices
"""

import re

# Federal Agencies - Available nationwide
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

# State Resources - Attorney General and Consumer Protection Offices
STATE_RESOURCES = {
    "AL": {
        "state": "Alabama",
        "attorney_general": {
            "name": "Alabama Attorney General's Office",
            "phone": "1-800-392-5658",
            "website": "www.alabamaag.gov"
        },
        "consumer_protection": {
            "name": "Alabama Consumer Protection Division",
            "phone": "334-242-7335",
            "website": "www.alabamaag.gov/consumer-protection"
        }
    },
    "AK": {
        "state": "Alaska",
        "attorney_general": {
            "name": "Alaska Department of Law",
            "phone": "907-269-5100",
            "website": "www.law.alaska.gov"
        },
        "consumer_protection": {
            "name": "Alaska Consumer Protection Unit",
            "phone": "907-269-5200",
            "website": "www.law.alaska.gov/consumer"
        }
    },
    "AZ": {
        "state": "Arizona",
        "attorney_general": {
            "name": "Arizona Attorney General's Office",
            "phone": "602-542-5025",
            "website": "www.azag.gov"
        },
        "consumer_protection": {
            "name": "Arizona Consumer Protection Division",
            "phone": "602-542-5763",
            "website": "www.azag.gov/consumer"
        }
    },
    "AR": {
        "state": "Arkansas",
        "attorney_general": {
            "name": "Arkansas Attorney General's Office",
            "phone": "1-800-482-8982",
            "website": "www.arkansasag.gov"
        },
        "consumer_protection": {
            "name": "Arkansas Consumer Protection Division",
            "phone": "501-682-2007",
            "website": "www.arkansasag.gov/consumer-protection"
        }
    },
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
    "CO": {
        "state": "Colorado",
        "attorney_general": {
            "name": "Colorado Attorney General's Office",
            "phone": "720-508-6000",
            "website": "www.coag.gov"
        },
        "consumer_protection": {
            "name": "Colorado Consumer Protection Division",
            "phone": "1-800-222-4444",
            "website": "www.coag.gov/consumer-protection"
        }
    },
    "CT": {
        "state": "Connecticut",
        "attorney_general": {
            "name": "Connecticut Attorney General's Office",
            "phone": "860-808-5318",
            "website": "www.ct.gov/ag"
        },
        "consumer_protection": {
            "name": "Connecticut Department of Consumer Protection",
            "phone": "1-800-842-2649",
            "website": "www.ct.gov/dcp"
        }
    },
    "DE": {
        "state": "Delaware",
        "attorney_general": {
            "name": "Delaware Department of Justice",
            "phone": "302-577-8400",
            "website": "www.attorneygeneral.delaware.gov"
        },
        "consumer_protection": {
            "name": "Delaware Consumer Protection Unit",
            "phone": "1-800-220-5424",
            "website": "www.attorneygeneral.delaware.gov/fraud"
        }
    },
    "DC": {
        "state": "District of Columbia",
        "attorney_general": {
            "name": "DC Office of the Attorney General",
            "phone": "202-727-3400",
            "website": "www.oag.dc.gov"
        },
        "consumer_protection": {
            "name": "DC Consumer Protection",
            "phone": "202-442-9828",
            "website": "www.oag.dc.gov/consumer-protection"
        }
    },
    "FL": {
        "state": "Florida",
        "attorney_general": {
            "name": "Florida Attorney General's Office",
            "phone": "1-866-966-7226",
            "website": "www.myfloridalegal.com"
        },
        "consumer_protection": {
            "name": "Florida Consumer Protection Division",
            "phone": "1-866-966-7226",
            "website": "www.myfloridalegal.com/consumer-protection"
        }
    },
    "GA": {
        "state": "Georgia",
        "attorney_general": {
            "name": "Georgia Attorney General's Office",
            "phone": "404-656-3300",
            "website": "www.law.georgia.gov"
        },
        "consumer_protection": {
            "name": "Georgia Consumer Protection Division",
            "phone": "1-800-869-1123",
            "website": "www.consumer.ga.gov"
        }
    },
    "HI": {
        "state": "Hawaii",
        "attorney_general": {
            "name": "Hawaii Department of the Attorney General",
            "phone": "808-586-1500",
            "website": "www.ag.hawaii.gov"
        },
        "consumer_protection": {
            "name": "Hawaii Office of Consumer Protection",
            "phone": "808-586-2630",
            "website": "www.cca.hawaii.gov/ocp"
        }
    },
    "ID": {
        "state": "Idaho",
        "attorney_general": {
            "name": "Idaho Attorney General's Office",
            "phone": "208-334-2400",
            "website": "www.ag.idaho.gov"
        },
        "consumer_protection": {
            "name": "Idaho Consumer Protection Division",
            "phone": "1-800-432-3545",
            "website": "www.ag.idaho.gov/consumer-protection"
        }
    },
    "IL": {
        "state": "Illinois",
        "attorney_general": {
            "name": "Illinois Attorney General's Office",
            "phone": "1-800-386-5438",
            "website": "www.illinoisattorneygeneral.gov"
        },
        "consumer_protection": {
            "name": "Illinois Consumer Protection Division",
            "phone": "1-800-243-0618",
            "website": "www.illinoisattorneygeneral.gov/consumers"
        }
    },
    "IN": {
        "state": "Indiana",
        "attorney_general": {
            "name": "Indiana Attorney General's Office",
            "phone": "1-800-382-5516",
            "website": "www.in.gov/attorneygeneral"
        },
        "consumer_protection": {
            "name": "Indiana Consumer Protection Division",
            "phone": "1-800-382-5516",
            "website": "www.in.gov/attorneygeneral/consumer-protection"
        }
    },
    "IA": {
        "state": "Iowa",
        "attorney_general": {
            "name": "Iowa Attorney General's Office",
            "phone": "515-281-5164",
            "website": "www.iowaattorneygeneral.gov"
        },
        "consumer_protection": {
            "name": "Iowa Consumer Protection Division",
            "phone": "515-281-5926",
            "website": "www.iowaattorneygeneral.gov/consumer-protection"
        }
    },
    "KS": {
        "state": "Kansas",
        "attorney_general": {
            "name": "Kansas Attorney General's Office",
            "phone": "1-888-428-8436",
            "website": "www.ag.ks.gov"
        },
        "consumer_protection": {
            "name": "Kansas Consumer Protection Division",
            "phone": "1-800-432-2310",
            "website": "www.ag.ks.gov/consumer-protection"
        }
    },
    "KY": {
        "state": "Kentucky",
        "attorney_general": {
            "name": "Kentucky Attorney General's Office",
            "phone": "502-696-5300",
            "website": "www.ag.ky.gov"
        },
        "consumer_protection": {
            "name": "Kentucky Consumer Protection Division",
            "phone": "1-888-432-9257",
            "website": "www.ag.ky.gov/consumer-protection"
        }
    },
    "LA": {
        "state": "Louisiana",
        "attorney_general": {
            "name": "Louisiana Attorney General's Office",
            "phone": "1-800-351-4889",
            "website": "www.ag.louisiana.gov"
        },
        "consumer_protection": {
            "name": "Louisiana Consumer Protection Section",
            "phone": "1-800-351-4889",
            "website": "www.ag.louisiana.gov/consumer"
        }
    },
    "ME": {
        "state": "Maine",
        "attorney_general": {
            "name": "Maine Attorney General's Office",
            "phone": "207-626-8800",
            "website": "www.maine.gov/ag"
        },
        "consumer_protection": {
            "name": "Maine Consumer Protection Division",
            "phone": "1-800-436-2131",
            "website": "www.maine.gov/ag/consumer"
        }
    },
    "MD": {
        "state": "Maryland",
        "attorney_general": {
            "name": "Maryland Attorney General's Office",
            "phone": "410-576-6300",
            "website": "www.marylandattorneygeneral.gov"
        },
        "consumer_protection": {
            "name": "Maryland Consumer Protection Division",
            "phone": "410-528-8662",
            "website": "www.marylandattorneygeneral.gov/cpd"
        }
    },
    "MA": {
        "state": "Massachusetts",
        "attorney_general": {
            "name": "Massachusetts Attorney General's Office",
            "phone": "617-727-2200",
            "website": "www.mass.gov/ago"
        },
        "consumer_protection": {
            "name": "Massachusetts Consumer Protection Division",
            "phone": "617-727-8400",
            "website": "www.mass.gov/consumer-protection"
        }
    },
    "MI": {
        "state": "Michigan",
        "attorney_general": {
            "name": "Michigan Attorney General's Office",
            "phone": "517-335-7622",
            "website": "www.michigan.gov/ag"
        },
        "consumer_protection": {
            "name": "Michigan Consumer Protection Division",
            "phone": "1-877-765-8388",
            "website": "www.michigan.gov/ag/consumer-protection"
        }
    },
    "MN": {
        "state": "Minnesota",
        "attorney_general": {
            "name": "Minnesota Attorney General's Office",
            "phone": "651-296-3353",
            "website": "www.ag.state.mn.us"
        },
        "consumer_protection": {
            "name": "Minnesota Consumer Protection Division",
            "phone": "651-296-3353",
            "website": "www.ag.state.mn.us/consumer"
        }
    },
    "MS": {
        "state": "Mississippi",
        "attorney_general": {
            "name": "Mississippi Attorney General's Office",
            "phone": "601-359-3680",
            "website": "www.ago.ms.gov"
        },
        "consumer_protection": {
            "name": "Mississippi Consumer Protection Division",
            "phone": "1-800-281-4418",
            "website": "www.ago.ms.gov/divisions/consumer-protection"
        }
    },
    "MO": {
        "state": "Missouri",
        "attorney_general": {
            "name": "Missouri Attorney General's Office",
            "phone": "573-751-3321",
            "website": "www.ago.mo.gov"
        },
        "consumer_protection": {
            "name": "Missouri Consumer Protection Division",
            "phone": "1-800-392-8222",
            "website": "www.ago.mo.gov/consumer-protection"
        }
    },
    "MT": {
        "state": "Montana",
        "attorney_general": {
            "name": "Montana Department of Justice",
            "phone": "406-444-2026",
            "website": "www.dojmt.gov"
        },
        "consumer_protection": {
            "name": "Montana Consumer Protection Office",
            "phone": "1-800-481-6896",
            "website": "www.dojmt.gov/consumer"
        }
    },
    "NE": {
        "state": "Nebraska",
        "attorney_general": {
            "name": "Nebraska Attorney General's Office",
            "phone": "402-471-2682",
            "website": "www.ago.nebraska.gov"
        },
        "consumer_protection": {
            "name": "Nebraska Consumer Protection Division",
            "phone": "1-800-727-6432",
            "website": "www.ago.nebraska.gov/consumer-protection"
        }
    },
    "NV": {
        "state": "Nevada",
        "attorney_general": {
            "name": "Nevada Attorney General's Office",
            "phone": "702-486-3420",
            "website": "www.ag.nv.gov"
        },
        "consumer_protection": {
            "name": "Nevada Consumer Protection Division",
            "phone": "1-888-434-9989",
            "website": "www.ag.nv.gov/consumer-protection"
        }
    },
    "NH": {
        "state": "New Hampshire",
        "attorney_general": {
            "name": "New Hampshire Department of Justice",
            "phone": "603-271-3658",
            "website": "www.doj.nh.gov"
        },
        "consumer_protection": {
            "name": "New Hampshire Consumer Protection Bureau",
            "phone": "1-888-468-4454",
            "website": "www.doj.nh.gov/consumer"
        }
    },
    "NJ": {
        "state": "New Jersey",
        "attorney_general": {
            "name": "New Jersey Attorney General's Office",
            "phone": "609-292-4925",
            "website": "www.nj.gov/oag"
        },
        "consumer_protection": {
            "name": "New Jersey Division of Consumer Affairs",
            "phone": "1-800-242-5846",
            "website": "www.njconsumeraffairs.gov"
        }
    },
    "NM": {
        "state": "New Mexico",
        "attorney_general": {
            "name": "New Mexico Attorney General's Office",
            "phone": "505-717-3500",
            "website": "www.nmag.gov"
        },
        "consumer_protection": {
            "name": "New Mexico Consumer Protection Division",
            "phone": "1-844-255-9210",
            "website": "www.nmag.gov/consumer-environmental-protection"
        }
    },
    "NY": {
        "state": "New York",
        "attorney_general": {
            "name": "New York Attorney General's Office",
            "phone": "1-800-771-7755",
            "website": "www.ag.ny.gov"
        },
        "consumer_protection": {
            "name": "New York Consumer Frauds Bureau",
            "phone": "1-800-771-7755",
            "website": "www.ag.ny.gov/consumer-frauds-bureau"
        }
    },
    "NC": {
        "state": "North Carolina",
        "attorney_general": {
            "name": "North Carolina Department of Justice",
            "phone": "919-716-6400",
            "website": "www.ncdoj.gov"
        },
        "consumer_protection": {
            "name": "North Carolina Consumer Protection Division",
            "phone": "1-877-566-7226",
            "website": "www.ncdoj.gov/consumer-protection"
        }
    },
    "ND": {
        "state": "North Dakota",
        "attorney_general": {
            "name": "North Dakota Attorney General's Office",
            "phone": "701-328-2210",
            "website": "www.attorneygeneral.nd.gov"
        },
        "consumer_protection": {
            "name": "North Dakota Consumer Protection Division",
            "phone": "1-800-472-2600",
            "website": "www.attorneygeneral.nd.gov/consumer-protection"
        }
    },
    "OH": {
        "state": "Ohio",
        "attorney_general": {
            "name": "Ohio Attorney General's Office",
            "phone": "614-466-4320",
            "website": "www.ohioattorneygeneral.gov"
        },
        "consumer_protection": {
            "name": "Ohio Consumer Protection Section",
            "phone": "1-800-282-0515",
            "website": "www.ohioattorneygeneral.gov/consumers"
        }
    },
    "OK": {
        "state": "Oklahoma",
        "attorney_general": {
            "name": "Oklahoma Attorney General's Office",
            "phone": "405-521-3921",
            "website": "www.oag.ok.gov"
        },
        "consumer_protection": {
            "name": "Oklahoma Consumer Protection Unit",
            "phone": "1-833-681-1895",
            "website": "www.oag.ok.gov/consumer-protection"
        }
    },
    "OR": {
        "state": "Oregon",
        "attorney_general": {
            "name": "Oregon Department of Justice",
            "phone": "503-378-4400",
            "website": "www.doj.state.or.us"
        },
        "consumer_protection": {
            "name": "Oregon Consumer Protection Division",
            "phone": "1-877-877-9392",
            "website": "www.doj.state.or.us/consumer-protection"
        }
    },
    "PA": {
        "state": "Pennsylvania",
        "attorney_general": {
            "name": "Pennsylvania Attorney General's Office",
            "phone": "1-800-441-2555",
            "website": "www.attorneygeneral.gov"
        },
        "consumer_protection": {
            "name": "Pennsylvania Bureau of Consumer Protection",
            "phone": "1-800-441-2555",
            "website": "www.attorneygeneral.gov/consumer"
        }
    },
    "RI": {
        "state": "Rhode Island",
        "attorney_general": {
            "name": "Rhode Island Attorney General's Office",
            "phone": "401-274-4400",
            "website": "www.riag.ri.gov"
        },
        "consumer_protection": {
            "name": "Rhode Island Consumer Protection Unit",
            "phone": "401-274-4400",
            "website": "www.riag.ri.gov/consumer-protection"
        }
    },
    "SC": {
        "state": "South Carolina",
        "attorney_general": {
            "name": "South Carolina Attorney General's Office",
            "phone": "803-734-3970",
            "website": "www.scag.gov"
        },
        "consumer_protection": {
            "name": "South Carolina Department of Consumer Affairs",
            "phone": "1-800-922-1594",
            "website": "www.consumer.sc.gov"
        }
    },
    "SD": {
        "state": "South Dakota",
        "attorney_general": {
            "name": "South Dakota Attorney General's Office",
            "phone": "605-773-3215",
            "website": "www.atg.sd.gov"
        },
        "consumer_protection": {
            "name": "South Dakota Consumer Protection Division",
            "phone": "1-800-300-1986",
            "website": "www.atg.sd.gov/consumer-protection"
        }
    },
    "TN": {
        "state": "Tennessee",
        "attorney_general": {
            "name": "Tennessee Attorney General's Office",
            "phone": "615-741-3491",
            "website": "www.tn.gov/attorneygeneral"
        },
        "consumer_protection": {
            "name": "Tennessee Division of Consumer Affairs",
            "phone": "1-800-342-8385",
            "website": "www.tn.gov/consumer"
        }
    },
    "TX": {
        "state": "Texas",
        "attorney_general": {
            "name": "Texas Attorney General's Office",
            "phone": "1-800-252-8011",
            "website": "www.texasattorneygeneral.gov"
        },
        "consumer_protection": {
            "name": "Texas Consumer Protection Division",
            "phone": "1-800-621-0508",
            "website": "www.texasattorneygeneral.gov/consumer-protection"
        }
    },
    "UT": {
        "state": "Utah",
        "attorney_general": {
            "name": "Utah Attorney General's Office",
            "phone": "801-538-9600",
            "website": "www.attorneygeneral.utah.gov"
        },
        "consumer_protection": {
            "name": "Utah Division of Consumer Protection",
            "phone": "1-800-721-7233",
            "website": "www.consumerprotection.utah.gov"
        }
    },
    "VT": {
        "state": "Vermont",
        "attorney_general": {
            "name": "Vermont Attorney General's Office",
            "phone": "802-656-3183",
            "website": "www.ago.vermont.gov"
        },
        "consumer_protection": {
            "name": "Vermont Consumer Assistance Program",
            "phone": "1-800-649-2424",
            "website": "www.ago.vermont.gov/consumer-protection"
        }
    },
    "VA": {
        "state": "Virginia",
        "attorney_general": {
            "name": "Virginia Attorney General's Office",
            "phone": "804-786-2071",
            "website": "www.oag.state.va.us"
        },
        "consumer_protection": {
            "name": "Virginia Consumer Protection Section",
            "phone": "1-800-552-9963",
            "website": "www.oag.state.va.us/consumer-protection"
        }
    },
    "WA": {
        "state": "Washington",
        "attorney_general": {
            "name": "Washington Attorney General's Office",
            "phone": "1-800-551-4636",
            "website": "www.atg.wa.gov"
        },
        "consumer_protection": {
            "name": "Washington Consumer Protection Division",
            "phone": "1-800-551-4636",
            "website": "www.atg.wa.gov/consumer-protection"
        }
    },
    "WV": {
        "state": "West Virginia",
        "attorney_general": {
            "name": "West Virginia Attorney General's Office",
            "phone": "1-800-368-8808",
            "website": "www.ago.wv.gov"
        },
        "consumer_protection": {
            "name": "West Virginia Consumer Protection Division",
            "phone": "1-800-368-8808",
            "website": "www.ago.wv.gov/consumerprotection"
        }
    },
    "WI": {
        "state": "Wisconsin",
        "attorney_general": {
            "name": "Wisconsin Department of Justice",
            "phone": "608-266-1221",
            "website": "www.doj.state.wi.us"
        },
        "consumer_protection": {
            "name": "Wisconsin Bureau of Consumer Protection",
            "phone": "1-800-422-7128",
            "website": "www.datcp.wi.gov/consumer"
        }
    },
    "WY": {
        "state": "Wyoming",
        "attorney_general": {
            "name": "Wyoming Attorney General's Office",
            "phone": "307-777-7841",
            "website": "www.ag.wyo.gov"
        },
        "consumer_protection": {
            "name": "Wyoming Consumer Protection Unit",
            "phone": "1-800-438-5799",
            "website": "www.ag.wyo.gov/consumer-protection"
        }
    }
}

# ZIP Code to State Mapping (first digit or range)
ZIP_TO_STATE = {
    # Alabama: 350-369
    range(35000, 37000): "AL",
    # Alaska: 995-999
    range(99500, 100000): "AK",
    # Arizona: 850-865
    range(85000, 86600): "AZ",
    # Arkansas: 716-729, 755-729
    range(71600, 73000): "AR",
    range(75500, 72900): "AR",
    # California: 900-961
    range(90000, 96200): "CA",
    # Colorado: 800-816
    range(80000, 81700): "CO",
    # Connecticut: 060-069
    range(6000, 7000): "CT",
    # Delaware: 197-199
    range(19700, 20000): "DE",
    # DC: 200-205
    range(20000, 20600): "DC",
    # Florida: 320-349
    range(32000, 35000): "FL",
    # Georgia: 300-319, 398-399
    range(30000, 32000): "GA",
    range(39800, 40000): "GA",
    # Hawaii: 967-968
    range(96700, 96900): "HI",
    # Idaho: 832-838
    range(83200, 83900): "ID",
    # Illinois: 600-629
    range(60000, 63000): "IL",
    # Indiana: 460-479
    range(46000, 48000): "IN",
    # Iowa: 500-528
    range(50000, 52900): "IA",
    # Kansas: 660-679
    range(66000, 68000): "KS",
    # Kentucky: 400-427
    range(40000, 42800): "KY",
    # Louisiana: 700-714
    range(70000, 71500): "LA",
    # Maine: 039-049
    range(3900, 5000): "ME",
    # Maryland: 206-219
    range(20600, 22000): "MD",
    # Massachusetts: 010-027
    range(1000, 2800): "MA",
    # Michigan: 480-499
    range(48000, 50000): "MI",
    # Minnesota: 550-567
    range(55000, 56800): "MN",
    # Mississippi: 386-397
    range(38600, 39800): "MS",
    # Missouri: 630-658
    range(63000, 65900): "MO",
    # Montana: 590-599
    range(59000, 60000): "MT",
    # Nebraska: 680-693
    range(68000, 69400): "NE",
    # Nevada: 889-898
    range(88900, 89900): "NV",
    # New Hampshire: 030-038
    range(3000, 3900): "NH",
    # New Jersey: 070-089
    range(7000, 9000): "NJ",
    # New Mexico: 870-884
    range(87000, 88500): "NM",
    # New York: 100-149
    range(10000, 15000): "NY",
    # North Carolina: 270-289
    range(27000, 29000): "NC",
    # North Dakota: 580-588
    range(58000, 58900): "ND",
    # Ohio: 430-458
    range(43000, 45900): "OH",
    # Oklahoma: 730-741, 743-749
    range(73000, 74200): "OK",
    range(74300, 75000): "OK",
    # Oregon: 970-979
    range(97000, 98000): "OR",
    # Pennsylvania: 150-196
    range(15000, 19700): "PA",
    # Rhode Island: 028-029
    range(2800, 3000): "RI",
    # South Carolina: 290-299
    range(29000, 30000): "SC",
    # South Dakota: 570-577
    range(57000, 57800): "SD",
    # Tennessee: 370-385
    range(37000, 38600): "TN",
    # Texas: 750-799, 885-888
    range(75000, 80000): "TX",
    range(88500, 88900): "TX",
    # Utah: 840-847
    range(84000, 84800): "UT",
    # Vermont: 050-059
    range(5000, 6000): "VT",
    # Virginia: 220-246
    range(22000, 24700): "VA",
    # Washington: 980-994
    range(98000, 99500): "WA",
    # West Virginia: 247-268
    range(24700, 26900): "WV",
    # Wisconsin: 530-549
    range(53000, 54900): "WI",
    # Wyoming: 820-831
    range(82000, 83200): "WY"
}


def extract_zip_code(text):
    """
    Extract ZIP code from text using regex.
    Looks for 5-digit patterns.
    """
    zip_match = re.search(r'\b\d{5}\b', text)
    return zip_match.group(0) if zip_match else None


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


def get_local_law_enforcement_info(state_code):
    """
    Get generic local law enforcement information.
    Returns formatted string with local law enforcement guidance.
    """
    return f"""**Local Law Enforcement:**

• Contact your local police department or sheriff's office
• To find your local department, search online for "[your city/county] police department"
• Call 911 for emergencies
• For non-emergency reports, look up your local department's non-emergency number

"""


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


def get_general_resources():
    """
    Returns general resources when ZIP code is not available.
    """
    resources_text = "Here are the key resources to report cybercrime:\n\n"
    resources_text += "=" * 60 + "\n\n"
    resources_text += get_federal_resources()
    resources_text += "=" * 60 + "\n\n"
    resources_text += """**State and Local Resources:**

To find your state-specific consumer protection office and Attorney General:
• Visit: www.usa.gov/state-consumer
• Or search: "[your state] attorney general consumer protection"

For local law enforcement:
• Contact your local police department or sheriff's office
• Call 911 for emergencies
• Search online for "[your city/county] police department" for non-emergency numbers

"""
    return resources_text
