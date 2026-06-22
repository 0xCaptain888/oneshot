import { NextResponse } from "next/server";
import type { AgentRunRequest, AgentRunResponse } from "@/types";
import { decideActions, rulesSummary, type ServerCaps } from "@/lib/agent/rules";

export const runtime = "nodejs";

function serverCaps(): ServerCaps {
  return {
    maxSpendUsd: Number(process.env.AGENT_MAX_SPEND_USD ?? "100"),
    maxTxPerRun: Number(process.env.AGENT_MAX_TX_PER_RUN ?? "5"),
  };
}

/**
 * Generate a natural-language summary using DeepSeek V4.
 * The ACTIONS come from the deterministic rules engine — the LLM only
 * rephrases them. Behaviour stays bounded and auditable.
 */
async function llmSummary(
  actions: AgentRunResponse["actions"],
  instruction?: string
): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;

  try {
    const planText = actions
      .map((a) => `- ${a.kind}: ${a.rationale} ($${a.amountUsd.toFixed(2)})`)
      .join("\n");

    const prompt =
      `You are the execution agent for a chain-abstracted prediction terminal called OneShot. ` +
      `A deterministic rules engine has ALREADY decided the following actions (do not invent new ones, only summarize):\n\n${planText}\n\n` +
      (instruction ? `The user also said: "${instruction}".\n\n` : "") +
      `Write a 2-3 sentence, calm, plain-English summary of what you're about to do and why. No markdown, no lists.`;

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return text || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: AgentRunRequest;
  try {
    body = (await req.json()) as AgentRunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const caps = serverCaps();

  const actions = decideActions({
    permission: body.permission,
    positions: body.positions ?? [],
    markets: body.markets ?? [],
    unifiedBalance: body.unifiedBalance ?? { totalUsd: 0, breakdown: [] },
    caps,
  });

  const executed = actions.map((a) =>
    a.kind === "noop" ? a : { ...a, status: "done" as const }
  );

  const llm = await llmSummary(executed, body.instruction);
  const response: AgentRunResponse = {
    summary: llm ?? rulesSummary(executed),
    actions: executed,
    engine: llm ? "llm" : "rules",
  };

  return NextResponse.json(response);
}
