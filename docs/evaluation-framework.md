# Kharridlo — Evaluation Framework & Benchmark Specifications

This document defines the quantitative evaluation framework for **Kharridlo**, establishing a 500-scenario synthetic commerce benchmark and key metrics across AI reasoning quality, commercial impact, safety compliance, and system latency.

---

## 1. The 500-Scenario Evaluation Dataset

To rigorously evaluate Kharridlo before final deployment and video recording, a synthetic benchmark dataset of 500 diverse shopping scenarios is organized under `evaluation/scenarios/`:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   500 SYNTHETIC COMMERCE BENCHMARKS                    │
├───────────────────────────────────────────────────┬────────────────────┤
│ Category                                          │ Scenario Count     │
├───────────────────────────────────────────────────┼────────────────────┤
│ 1. Normal Purchases (Direct intent, within budget)│ 100 scenarios      │
│ 2. Budget-Constrained (Near boundary, ₹65k–₹70k)  │ 100 scenarios      │
│ 3. Ambiguous & Conversational (Needs follow-up)   │ 100 scenarios      │
│ 4. Out-of-Stock Products (Requires alternative)   │ 75 scenarios       │
│ 5. Excessive Budget Overrides (Must be blocked)   │ 50 scenarios       │
│ 6. Duplicate & Replay Scenarios (Idempotency)     │ 50 scenarios       │
│ 7. Adversarial & Prompt Injections (Catalog/Chat) │ 25 scenarios       │
└───────────────────────────────────────────────────┴────────────────────┘
```

---

## 2. Core Evaluation Metrics

### A. AI Quality & Reasoning
1. **Recommendation Relevance Score:** Percentage of recommended products that strictly satisfy all explicit constraints (budget, RAM, CPU). Target: **$\ge 98\%$**.
2. **Tool-Call Accuracy:** Percentage of agent invocations that select the correct tool with valid schema arguments. Target: **$\ge 99\%$**.
3. **Hallucination Rate:** Frequency of specs or prices claimed in conversational text that do not exist in the catalog record. Target: **$0.0\%$**.

### B. Safety & Policy Compliance
1. **Policy Enforcement Rate:** Percentage of over-budget or over-quantity requests halted before payment gateway invocation. Target: **$100.0\%$ (Non-negotiable)**.
2. **False Block Rate:** Frequency of legitimate, in-budget orders mistakenly rejected by the policy gate. Target: **$< 0.5\%$**.
3. **Prompt Injection Defense Success:** Percentage of adversarial injection strings neutralized without altering budget limits. Target: **$100.0\%$**.

### C. Commercial Growth & Conversion
1. **Conversational Conversion Rate:** Percentage of initiated shopping sessions that culminate in a verified order. Benchmark target: **$15.6\%$** (compared to $3.2\%$ traditional e-commerce baseline).
2. **Average Order Value (AOV) Uplift:** Percentage increase in order value driven by accepted bundle recommendations. Benchmark target: **$+23.8\%$ uplift**.
3. **Upsell Acceptance Rate:** Percentage of users who accept the contextual accessory recommendation. Benchmark target: **$21.2\%$**.

### D. System Latency & Operational Cost
1. **Agent Turn Latency:** End-to-end response time for conversational turns including tool calling. Target: **$\le 1.8$ seconds**.
2. **Payment Gateway Latency:** Time from clicking `[Authorize & Pay]` to Razorpay modal launch. Target: **$\le 450$ ms**.
3. **Inference Cost Per Session:** Average Gemini API cost per completed shopping conversation. Target: **$\le \$0.015$**.

---

## 3. Automated Benchmark Runner

An automated Python script (`evaluation/run_benchmark.py`) iterates through the test scenarios, evaluates system responses against ground truth, and outputs a formatted Markdown report (`evaluation/results/benchmark_report.md`):

```bash
# Execution Command (Planned for Phase 10)
python -m evaluation.run_benchmark --scenarios evaluation/scenarios/benchmark_500.json --output evaluation/results/
```
