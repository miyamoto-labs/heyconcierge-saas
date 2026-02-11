export interface Agent {
  id: number;
  name: string;
  role: string;
  level: "L1" | "L2" | "L3" | "L4";
  status: "active" | "idle" | "disabled" | "error";
  model: string;
  schedule: string;
  projects: string[];
  lastReview: string;
}

export interface Activity {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  result: "success" | "fail";
  details: string;
}

export interface Project {
  name: string;
  slug: string;
  agents: string[];
  status: "active" | "planning" | "paused";
  description: string;
}
