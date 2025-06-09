// Import the MCP server and transport, as well as Zod for schema validation
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * This is a simple reminder server that allows users to set reminders.
 * It uses the Model Context Protocol (MCP) to handle requests and responses.
 * The server listens for requests to add reminders and responds with confirmation.
 */

// Create a new MCP server instance with metadata (name and version)
// The server is initialized with empty resources and tools capabilities
const server = new McpServer({ name: "reminders", version: "1.0.0" }, {
    capabilities: {
        resources: {}, // No resources are defined for this server
        tools: {}      // Tools will be registered below
    }
});

// Register a tool called "add-reminder" with the server
// This tool allows users to add reminders by specifying reminder text, time, and recurrence
server.tool(
    "add-reminder", // Tool name
    "Add a reminder for the user", // Tool description
    {
        // Define the input schema using Zod
        reminderText: z.string().describe("Free form text containing the content of the reminder"),
        reminderTime: z.string().optional().describe(
            "Contains the date time of the reminder in ISO format if it is specified by the user. " +
            "Use this field only if a single specific point in time is mentioned in the reminder. " +
            "For recurring reminders, use recurranceTime."
        ),
        recurranceTime: z.string().optional().describe(
            "Contains the date time of the recurring reminder in iCalendar RRULE format if it is specified by the user. " +
            "Use this field only for recurring reminders or for reminders with more than one point in time. " +
            "If a single specific point in time is mentioned in the reminder, use reminderTime field."
        )
    },
    // Tool handler function: processes the input and returns a response
    async ({ reminderText, reminderTime, recurranceTime }, ctx) => {
        // Attempt to parse the reminderTime string into a Date object
        // If parsing fails, parsedTime will be null
        let parsedTime: Date | null = null;
        if (reminderTime) {
            try {
                parsedTime = new Date(reminderTime);
                if (isNaN(parsedTime.getTime())) {
                    throw new Error("Invalid date");
                }
            } catch (e) { /* Ignore parsing errors, parsedTime stays null */ }
        }

        // Perform a basic validation of the recurrence rule (RRULE) format
        // This is a simple check; for production use, consider using a dedicated RRULE parser
        let rruleValid = true;
        if (recurranceTime) {
            rruleValid = recurranceTime.startsWith("FREQ="); // Basic check for RRULE format
        }

        // Prepare a detailed response containing all relevant information
        let response = [
            `Request ID: ${ctx.requestId}`,
            `Your reminder is set.`,
            `Reminder Content: "${reminderText}"`,
            `Reminder Time: ${reminderTime}`,
            `Parsed Time: ${parsedTime}`,
            `Recurrence Rule: ${recurranceTime || "None"}`,
            `Recurrence Rule Valid: ${rruleValid}`,
        ];
        // Return the response as a text message
        return {
            content: [{ type: "text", text: response.join("\n") }],
        };
    }
);

/**
 * Main entry point for the server.
 * Sets up the transport (communication channel) and starts listening for requests.
 */
async function main() {
    // Use standard input/output as the transport mechanism for the server
    const transport = new StdioServerTransport();
    // Connect the server to the transport and start handling requests
    await server.connect(transport);
    // Log to stderr that the server is running
    console.error("Reminder server running on stdio.");
}

// Start the server and handle any fatal errors gracefully
main().catch((error) => {
    console.error(`Fatal error in main():`, error);
    process.exit(1);
});