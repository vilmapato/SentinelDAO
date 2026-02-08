"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { SideNav } from "~~/components/landing/SideNav";
import { Section } from "~~/components/landing/Section";

const sections = [
  { id: "01", label: "01" },
  { id: "02", label: "02" },
  { id: "03", label: "03" },
  { id: "04", label: "04" },
  { id: "05", label: "05" },
  { id: "06", label: "06" },
  { id: "07", label: "07" },
];

const Home: NextPage = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      <SideNav sections={sections} />

      {/* Section 01: THE PROBLEM */}
      <Section id="01" number="THE_PROBLEM" title="SentinelDAO">
        <p className="text-3xl sm:text-4xl lg:text-5xl text-gray-400 mb-16 leading-tight">
          Autonomous Treasury Execution for DAOs
        </p>
        <div className="space-y-8 text-gray-300 text-2xl sm:text-3xl max-w-4xl">
          <p className="leading-relaxed">
            DAOs approve budgets onchain — but still rely on humans to execute payments.
          </p>
          <p className="leading-relaxed">
            Manual treasury operations introduce delays, errors, and operational risk as organizations scale.
          </p>
          <ul className="space-y-6 mt-12">
            {["Manual execution", "Operational bottlenecks", "Poor auditability", "Doesn't scale with DAO growth"].map(
              item => (
                <li key={item} className="flex items-start">
                  <span className="text-orange-500 mr-6 text-3xl">▸</span>
                  <span>{item}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </Section>

      {/* Section 02: THE SOLUTION */}
      <Section id="02" number="THE_SOLUTION" title="A Treasury Agent That Executes Policy, Not Instructions">
        <div className="space-y-10 text-gray-300 text-2xl sm:text-3xl max-w-4xl">
          <p className="leading-relaxed">
            SentinelDAO introduces an autonomous treasury agent that monitors on-chain policies and executes USDC
            payouts automatically when predefined conditions are met.
          </p>
          <ul className="space-y-6">
            {[
              "Policies live onchain",
              "Execution is autonomous",
              "Human-in-the-loop safety",
              "Fully auditable transactions",
            ].map(item => (
              <li key={item} className="flex items-start">
                <span className="text-orange-500 mr-6 text-3xl">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-16 p-10 border-2 border-orange-500/20 rounded-lg bg-orange-500/5">
            <div className="flex items-center justify-center gap-12 text-center font-mono">
              <div>
                <div className="text-4xl font-bold text-orange-500">OBSERVE</div>
                <div className="text-lg text-gray-500 mt-3">Monitor chain</div>
              </div>
              <div className="text-orange-500 text-4xl">→</div>
              <div>
                <div className="text-4xl font-bold text-orange-500">DECIDE</div>
                <div className="text-lg text-gray-500 mt-3">Evaluate policy</div>
              </div>
              <div className="text-orange-500 text-4xl">→</div>
              <div>
                <div className="text-4xl font-bold text-orange-500">ACT</div>
                <div className="text-lg text-gray-500 mt-3">Execute payout</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 03: HOW IT WORKS */}
      <Section id="03" number="HOW_IT_WORKS" title="From Policy to Payment — Automatically">
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl">
          {[
            {
              num: "1",
              title: "Define a Policy",
              desc: "Recipients, amounts, schedule, approvals",
            },
            {
              num: "2",
              title: "Fund the Treasury",
              desc: "USDC deposited once",
            },
            {
              num: "3",
              title: "Autonomous Execution",
              desc: "Agent executes when due; pause anytime",
            },
          ].map(step => (
            <div key={step.num} className="p-10 border-2 border-gray-800 rounded-lg hover:border-orange-500/50 transition-colors">
              <div className="text-7xl font-bold text-orange-500 mb-6">{step.num}</div>
              <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-400 text-xl leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 04: WHY AUTONOMY */}
      <Section id="04" number="WHY_AUTONOMY" title="Why Autonomous Treasury Beats Manual Ops">
        <div className="grid md:grid-cols-2 gap-16 max-w-5xl">
          <div className="space-y-7">
            <h3 className="text-4xl font-bold text-gray-500 mb-8">Manual Treasury</h3>
            {["Human execution", "Error-prone", "Delays", "Hard to scale"].map(item => (
              <div key={item} className="flex items-start text-gray-400 text-2xl">
                <span className="text-red-500 mr-5 text-3xl">✗</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="space-y-7">
            <h3 className="text-4xl font-bold text-orange-500 mb-8">SentinelDAO</h3>
            {["Deterministic execution", "Policy enforcement", "Auditability", "Scales with organization size"].map(
              item => (
                <div key={item} className="flex items-start text-gray-200 text-2xl">
                  <span className="text-green-500 mr-5 text-3xl">✓</span>
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </Section>

      {/* Section 05: USE CASES */}
      <Section id="05" number="USE_CASES" title="Built for Real DAO Operations">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
          {[
            "Contributor payroll",
            "Grant tranches",
            "Revenue distribution",
            "Service provider payments",
            "Ecosystem fund management",
          ].map(useCase => (
            <div
              key={useCase}
              className="p-10 border-2 border-gray-800 rounded-lg hover:border-orange-500/50 transition-colors"
            >
              <span className="text-orange-500 text-4xl mb-4 block">⚡</span>
              <p className="text-gray-200 text-xl">{useCase}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 06: WHY ARC + USDC */}
      <Section id="06" number="WHY_ARC_USDC" title="Why SentinelDAO Runs on Arc with USDC">
        <div className="space-y-10 text-gray-300 text-2xl sm:text-3xl max-w-4xl">
          <p className="leading-relaxed">
            Autonomous financial operations require reliability, not volatility.
          </p>
          <p className="leading-relaxed">
            SentinelDAO uses USDC as a stable unit of account and Arc as a purpose-built execution layer for
            predictable, scalable treasury operations.
          </p>
          <ul className="space-y-6 mt-12">
            {["Stable settlement", "Deterministic execution", "Built for real-world finance"].map(item => (
              <li key={item} className="flex items-start">
                <span className="text-orange-500 mr-6 text-3xl">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Section 07: LIVE SYSTEM */}
      <Section id="07" number="LIVE_SYSTEM" title="See SentinelDAO in Action">
        <div className="space-y-12 max-w-4xl">
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/dashboard"
              className="btn btn-lg bg-orange-500 hover:bg-orange-600 text-white border-none px-12 py-6 text-2xl font-bold"
            >
              Open Live Dashboard →
            </Link>
            <a
              href="https://github.com/vilmapato/SentinelDAO/blob/main/docs/architecture.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg btn-outline border-2 border-gray-700 hover:border-orange-500 text-gray-300 px-12 py-6 text-2xl"
            >
              View Architecture
            </a>
          </div>

          <div className="mt-16 p-10 border-2 border-gray-800 rounded-lg space-y-5 font-mono text-xl">
            <div className="flex justify-between">
              <span className="text-gray-500">Treasury:</span>
              <span className="text-green-500 font-bold">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Policies:</span>
              <span className="text-gray-300">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Execution:</span>
              <span className="text-gray-300">—</span>
            </div>
          </div>
        </div>
      </Section>
      </div>
  );
};

export default Home;
