import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type Candidate = {
  id: string;
  name: string;
  role: string;
  date: string;
  scores: {
    confidence: number; // 1-5
    speaking: number; // 1-5
    understanding: number; // 1-5
    technical: number; // 1-5
  };
  recommendation: "Proceed" | "Hold" | "Reject";
  summary: string;
  examples: { topic: string; example: string; code?: string }[];
};

const candidates: Candidate[] = [
  {
    id: "hemanth",
    name: "Hemanth",
    role: "Conversational AI Engineer",
    date: "2025-08-01",
    scores: { confidence: 4.2, speaking: 4.0, understanding: 4.5, technical: 4.3 },
    recommendation: "Proceed",
    summary:
      "Demonstrated strong grasp of intent classification, dialog state tracking, and evaluation metrics. Communicated clearly with confident, structured answers and solid examples.",
    examples: [
      {
        topic: "NLU & Orchestration",
        example:
          "Explained trade-offs between Rasa-style pipelines vs. LLM-first orchestration and when to use retrieval-augmented generation (RAG).",
      },
      {
        topic: "Evaluation",
        example:
          "Outlined a rubric combining human-in-the-loop ratings, task success rate, and confusion triggers to continuously improve the assistant.",
      },
      {
        topic: "Tool Use",
        example:
          "Gave a clear approach for function calling with guardrails and schema validation using Zod.",
        code: `// Example: Safe function calling with Zod
import { z } from "zod";

const WeatherArgs = z.object({ city: z.string(), unit: z.enum(["C","F"]) });

type WeatherFn = (args: z.infer<typeof WeatherArgs>) => Promise<string>;

const getWeather: WeatherFn = async ({ city, unit }) => {
  // fetch from weather API
  return "Temperature in " + city + " is 30" + unit;
};

async function callTool(name: string, rawArgs: unknown) {
  if (name === "getWeather") {
    const args = WeatherArgs.parse(rawArgs);
    return await getWeather(args);
  }
  throw new Error("Unknown tool");
}`,
      },
    ],
  },
  {
    id: "shekar",
    name: "Shekar",
    role: "AI Product Engineer",
    date: "2025-08-02",
    scores: { confidence: 3.7, speaking: 3.8, understanding: 4.0, technical: 3.9 },
    recommendation: "Proceed",
    summary:
      "Good understanding of LLM prompting, safety patterns, and analytics. Communication was clear though occasionally verbose; balanced with practical implementation ideas.",
    examples: [
      {
        topic: "Safety",
        example:
          "Suggested layered moderation (input/output), sensitive intent routing, and refusals with recovery prompts.",
      },
      {
        topic: "Observability",
        example:
          "Proposed tracing with LangSmith/OpenTelemetry and feedback loops for regression detection.",
      },
    ],
  },
];

function scoreToPercent(s: number) {
  return Math.round((Math.min(5, Math.max(0, s)) / 5) * 100);
}

function RecBadge({ rec }: { rec: Candidate["recommendation"] }) {
  const variant =
    rec === "Proceed" ? "default" : rec === "Hold" ? "secondary" : "destructive";
  const Icon = rec === "Proceed" ? CheckCircle2 : rec === "Hold" ? Clock : AlertTriangle;
  return (
    <Badge variant={variant as any} className="flex items-center gap-2">
      <Icon className="h-4 w-4" /> {rec}
    </Badge>
  );
}

export default function InterviewAnalysis() {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id ?? "");
  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? candidates[0],
    [selectedId]
  );

  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Interview Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Review conversational AI interview evaluations with ratings and recommendations.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Candidate Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Candidate</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Speaking</TableHead>
                  <TableHead>Understanding</TableHead>
                  <TableHead>Technical</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow
                    key={c.id}
                    className={c.id === selected?.id ? "bg-accent/40" : "cursor-pointer"}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.scores.confidence.toFixed(1)}/5</TableCell>
                    <TableCell>{c.scores.speaking.toFixed(1)}/5</TableCell>
                    <TableCell>{c.scores.understanding.toFixed(1)}/5</TableCell>
                    <TableCell>{c.scores.technical.toFixed(1)}/5</TableCell>
                    <TableCell>
                      <RecBadge rec={c.recommendation} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Candidate</div>
              <div className="text-base font-medium text-foreground">{selected?.name}</div>
              <div className="text-sm text-muted-foreground">{selected?.role}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ScoreCard label="Confidence" value={selected?.scores.confidence ?? 0} />
              <ScoreCard label="Speaking" value={selected?.scores.speaking ?? 0} />
              <ScoreCard label="Understanding" value={selected?.scores.understanding ?? 0} />
              <ScoreCard label="Technical" value={selected?.scores.technical ?? 0} />
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Recommendation</div>
              {selected && <RecBadge rec={selected.recommendation} />}
            </div>

            {selected?.summary && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Summary</div>
                <p className="text-sm leading-6 text-foreground">{selected.summary}</p>
              </div>
            )}

            {selected?.examples?.length ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Examples</div>
                <div className="space-y-3">
                  {selected.examples.map((ex, i) => (
                    <article key={i} className="rounded-md border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">{ex.topic}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ex.example}</p>
                      {ex.code && (
                        <pre className="mt-3 overflow-auto rounded-md border bg-muted p-3 text-sm">
                          <code>{ex.code}</code>
                        </pre>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const percent = scoreToPercent(value);
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value.toFixed(1)}/5</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
