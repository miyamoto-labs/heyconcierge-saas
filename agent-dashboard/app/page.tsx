"use client";

import { agents, projects, sampleActivity } from "@/lib/data";
import { Agent, Activity } from "@/lib/types";
import { useState } from "react";

const levelColors: Record<string, string> = {
  L1: "bg-gray-600 text-gray-200",
  L2: "bg-yellow-600/80 text-yellow-100",
  L3: "bg-green-600/80 text-green-100",
  L4: "bg-purple-600/80 text-purple-100",
};

const levelGlow: Record<string, string> = {
  L1: "border-gray-700",
  L2: "border-yellow-800/50",
  L3: "border-green-800/50",
  L4: "border-purple-800/50",
};

const statusIcon: Record<string, string> = {
  active: "🟢",
  idle: "🟡",
  disabled: "🔴",
  error: "🔴",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className={`bg-dark-card border ${levelGlow[agent.level]} rounded-lg p-4 hover:bg-dark-hover transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColors[agent.level]}`}>
          {agent.level}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{agent.role}</p>
      <div className="space-y-1 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Status</span>
          <span>{statusIcon[agent.status]} {agent.status}</span>
        </div>
        <div className="flex justify-between">
          <span>Model</span>
          <span className="text-gray-300">{agent.model}</span>
        </div>
        <div className="flex justify-between">
          <span>Schedule</span>
          <span className="text-gray-300">{agent.schedule}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-hover border-b border-dark-border transition-colors">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activity.result === "success" ? "bg-green-500" : "bg-red-500"}`} />
      <span className="text-[10px] text-gray-600 w-16 flex-shrink-0 font-mono">{timeAgo(activity.timestamp)}</span>
      <span className="text-xs font-medium text-purple-400 w-32 flex-shrink-0 truncate">{activity.agent}</span>
      <span className="text-xs text-gray-400 flex-1 truncate">{activity.action}</span>
      <span className="text-[10px] text-gray-600 hidden md:block max-w-48 truncate">{activity.details}</span>
    </div>
  );
}

function ProjectCard({ project }: { project: typeof projects[0] }) {
  const statusColors: Record<string, string> = {
    active: "text-green-400",
    planning: "text-yellow-400",
    paused: "text-gray-500",
  };
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4 hover:bg-dark-hover transition-all">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-white text-sm">{project.name}</h3>
        <span className={`text-[10px] uppercase font-medium ${statusColors[project.status]}`}>{project.status}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{project.description}</p>
      <div className="flex flex-wrap gap-1">
        {project.agents.map((a) => (
          <span key={a} className="text-[10px] bg-dark-bg px-2 py-0.5 rounded text-gray-400">{a}</span>
        ))}
      </div>
    </div>
  );
}

function StatsBar() {
  const total = sampleActivity.length;
  const successes = sampleActivity.filter((a) => a.result === "success").length;
  const fails = total - successes;
  const rate = Math.round((successes / total) * 100);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const levels = { L1: 0, L2: 0, L3: 0, L4: 0 };
  agents.forEach((a) => levels[a.level]++);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {[
        { label: "Active Agents", value: `${activeAgents}/${agents.length}`, color: "text-green-400" },
        { label: "Success Rate", value: `${rate}%`, color: "text-purple-400" },
        { label: "Total Runs (24h)", value: `${total}`, color: "text-white" },
        { label: "Errors (24h)", value: `${fails}`, color: fails > 0 ? "text-red-400" : "text-green-400" },
        { label: "Level Split", value: `${levels.L2}×L2 ${levels.L3}×L3 ${levels.L4}×L4`, color: "text-gray-300" },
      ].map((s) => (
        <div key={s.label} className="bg-dark-card border border-dark-border rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
          <p className={`text-lg font-bold ${s.color} mt-1`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function QuickActions() {
  const [msg, setMsg] = useState("");
  const doAction = (action: string) => {
    setMsg(`✅ ${action} — triggered`);
    setTimeout(() => setMsg(""), 3000);
  };
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
      <h2 className="text-sm font-semibold text-white mb-3">⚡ Quick Actions</h2>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => doAction("Performance review")} className="text-xs bg-purple-600/20 text-purple-400 border border-purple-800/40 px-3 py-1.5 rounded hover:bg-purple-600/30 transition">
          📊 Run Performance Review
        </button>
        <button onClick={() => doAction("Agent status toggle")} className="text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-800/40 px-3 py-1.5 rounded hover:bg-yellow-600/30 transition">
          🔄 Toggle Agent Status
        </button>
        <button onClick={() => doAction("Logs opened")} className="text-xs bg-green-600/20 text-green-400 border border-green-800/40 px-3 py-1.5 rounded hover:bg-green-600/30 transition">
          📋 View Agent Logs
        </button>
      </div>
      {msg && <p className="text-xs text-green-400 mt-2">{msg}</p>}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              <span className="text-purple-400">MIYAMOTO</span> LABS
            </h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Agent Command Center</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500">11 agents • all systems nominal</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsBar />

        {/* Agents Grid */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🤖 Agent Fleet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <section className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">📡 Activity Feed</h2>
            <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
              {sampleActivity.map((a) => (
                <ActivityRow key={a.id} activity={a} />
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Projects */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">📁 Projects</h2>
              <div className="space-y-3">
                {projects.map((p) => (
                  <ProjectCard key={p.slug} project={p} />
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <QuickActions />
          </div>
        </div>
      </main>

      <footer className="border-t border-dark-border px-6 py-3 mt-8">
        <p className="text-[10px] text-gray-700 text-center"><a href="https://miyamotolabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition">MIYAMOTO LABS</a> — Autonomous AI Systems • Oslo, Norway</p>
      </footer>
    </div>
  );
}
