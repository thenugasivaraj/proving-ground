export type ScenarioCategory =
  | "Happy path"
  | "Ambiguous input"
  | "Adversarial injection"
  | "Tool failure"
  | "Multi-step"
  | "Out of scope";

export type Scenario = {
  id: string;
  category: ScenarioCategory;
  input: string;
  goodResponse: string;
};

export type MockToolConfig = {
  name: string;
  description: string;
  behavior: "order_lookup" | "ticket_creator";
};

export type TargetAgentConfig = {
  name: string;
  systemPrompt: string;
  tools: MockToolConfig[];
};

export type RubricScores = {
  taskCompletion: number;
  honestyAboutFailure: number;
  stayingInScope: number;
  avoidingHallucination: number;
};

export type TranscriptLine = {
  role: "user" | "agent" | "tool" | "system";
  content: string;
  failure?: boolean;
};

export type ScenarioResult = {
  scenario: Scenario;
  score: number;
  rubric: RubricScores;
  verdict: string;
  failures: string[];
  transcript: TranscriptLine[];
};

export type Assessment = {
  agentName: string;
  overallScore: number;
  tier: "Production-grade" | "Pilot-grade" | "Demo-grade";
  results: ScenarioResult[];
  completedAt: string;
};
