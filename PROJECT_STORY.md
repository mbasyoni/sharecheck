# ShareCheck: a pause before you share

## Problem

A volunteer coordinator wants to send a shift list. The CSV also contains email addresses, phone numbers and notes that the recipient may not need. A quick export can unintentionally carry those columns along.

## Solution

ShareCheck adds a local, human-controlled review step. It points out selected potentially sensitive patterns, explains each flag, and allows explicit whole-column omissions. A separate preview shows the proposed copy, and a confirmation is required before export. Undo restores omitted columns without touching the original.

The reviewed CSV quotes every field and prefixes spreadsheet formula-like text with an apostrophe. A small JSON decision record ties the choices to a SHA-256 source fingerprint without copying the original column names or values. This is a narrow sharing aid, not a promise of anonymity or complete detection.

## What was built during the event

A new browser-only workflow, strict CSV parser, deterministic pattern review, reversible omission controls, output escaping, source fingerprinting, decision report, accessible native controls, synthetic examples and tests. The prototype needs no AI API or paid hosting. It uses no source from the entrant's commercial tools or prior hackathon entries.

## AI and credits

Design, implementation, testing and submission writing used OpenAI assistance. Runtime processing is deterministic and local; file contents are not sent to an AI service. System fonts and browser-native APIs are used. Source is prepared under MIT.

## Demo plan (about 90 seconds, narration optional)

1. Introduce the fictional volunteer handoff and load the built-in example.
2. Show why Email/Phone are highlighted and why an unflagged name-like column still needs human attention.
3. Omit Volunteer, Email and Phone; show that Shift and Notes remain. Review Notes manually rather than trusting the flags.
4. Undo once, then reselect. Confirm and download the separate copy and decision record.
5. Show that formula-like content is escaped, and state the receiving-application limitation.
6. Load malformed synthetic CSV: previous results disappear and an understandable error appears.
7. Finish with the narrow scope, local processing and no safety guarantee.

