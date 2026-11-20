import { CopilotClient, type CopilotSession } from "@microsoft/copilot-sdk";

async function main(): Promise<void> {
  const client = new CopilotClient({ mode: "coding-agent" });
  await client.start();

  let session: CopilotSession | undefined;

  try {
    session = await client.createSession({});
    const response = await session.sendAndWait({
      prompt:
        "Summarize these facts in one short sentence: added search, fixed login.",
    });

    if (response === undefined) {
      throw new Error("Copilot returned no response");
    }

    console.log(response.data.content);
  } finally {
    try {
      await session?.disconnect();
    } finally {
      await client.stop();
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
