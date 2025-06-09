import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";


const ENABLE_DELAYS = false;
const ENABLE_PROGRESS = false;
const server = new McpServer({ name: "reminders", version: "1.0.0" }, {
    capabilities: {
        resources: {},
        tools: {}
    }
});

server.tool("add-reminder", "Add a reminder for the user", {
    reminderText: z.string().describe("Free form text containing the content of the reminder"),
    reminderTime: z.string().optional().describe("Contains the date time of the reminder in ISO format if it is specified by the user. Use this field only if a single specific point in time is mentioned in the reminder. For recurring reminders, use recurranceReminderTime."),
    recurranceReminderTime: z.string().optional().describe("Contains the date time of the recurring reminder in iCalendar RRULE format if it is specified by the user. Use this field only for recurring reminders or for reminders with more than one point in time. if a single specific point in time is mentioned in the reminder, use reminderTime field.")
},
    async ({ reminderText, reminderTime, recurranceReminderTime }, ctx) => {
        SendProgress(10, ctx);

        let baseText = [
            `Request ID : ${ctx.requestId}`,
            `Progress Token : ${ctx._meta?.progressToken}`,
            `Your reminder is set.`,
            `Reminder Content: "${reminderText}"`
        ]
        if (reminderTime) {
            const reminderTimeParsed = TryGetDateTime(reminderTime);
            if (reminderTimeParsed) {
                baseText.push(`Reminder Time: ISO- ${reminderTime}. Parsed- ${reminderTimeParsed}`);
            }
        }

        ENABLE_DELAYS && await Delay(2000);
        SendProgress(20, ctx);

        if (recurranceReminderTime) {
            baseText.push(`Reminder recurrance: ${recurranceReminderTime}.`);
        }

        ENABLE_DELAYS && await Delay(2000);
        SendProgress(90, ctx);
        return {
            content: [
                {
                    type: "text",
                    text: baseText.join("\n")
                }
            ]
        }
    });

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Reminder server running on stdio.");
}

main().catch((error) => {
    console.error(`Fatal error in main():`, error);
    process.exit(1);
})

function TryGetDateTime(reminderTime: string): Date | null {
    try {
        const date = new Date(reminderTime);
        if (isNaN(date.getTime())) { // Check for invalid date
            return null; // Indicate transformation failure
        }
        return date;
    } catch (e) {
        return null; // Indicate transformation failure
    }
}

// Function to send a progress message
function SendProgress(progressValue: number, ctx: RequestHandlerExtra<ServerRequest, ServerNotification>) {
    ENABLE_PROGRESS && ctx.sendNotification({
        method: "notifications/progress",
        params: {
            progress: progressValue,
            progressToken: ctx._meta?.progressToken ?? 1,
            message: "Adding reminder...",
            total: 100
        }
    });
}

function Delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}