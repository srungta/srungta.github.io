## Scenario 1: Basic MCP server that can add a reminder from text
Prompt: Add a reminder to catch the bus 
Capture the text in tool argument "reminderText"

## Scenario 2: Add a reminder from text with date and time
Prompt: Add a reminder to catch the bus at 7 PM tomorrow
Capture the text in tool argument "reminderText" and the reminderTime in "reminderTime"

## Scenario 2: Show date parsing error when the type of reminderTime is set as z.date() instead of z.string()
Prompt: Add a reminder to catch the bus at 7 PM tomorrow

Error executing code: MCP error -32602: MCP error -32602: Invalid arguments for tool add-reminder: [
  {
    "code": "invalid_type",
    "expected": "date",
    "received": "string",
    "path": [
      "reminderTime"
    ],
    "message": "Expected date, received string"
  }
]

Highlight using simple data types and validating them in the server code.

## Scenario 4: Add a reminder to capture recurring intent 
Prompt: Catch the bus everyday at 7 PM
HIghlight that , with no argument to capture recurrance, LLms usually pass just the first instance. The data comes as a single value

## Scenario 5: Improve scenario 4 by correctly handling recurrance.
Prompt: Catch the bus everyday at 7 PM
Add a "recurranceTime" argument. Recurrance with correct parameter gets correct value. Use ICalendar RRULE.


## Scenario 6: Follow ups with multiple calls.
Prompt 1: Remind me to catch the bus ta 7pm everyday
Prompt 2: Actually on mondays i should leave early at 6

Highlight that LLms can make multiple calls to the MCP server and the server should be able to handle the updates. 
