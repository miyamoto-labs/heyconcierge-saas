# EU AI Act Compliance Documentation

**HeyConcierge AI Guest Concierge Service**

**Version 1.0 | February 2026**
**Prepared by:** HeyConcierge AS
**Contact:** hello@heyconcierge.io

---

## 1. Purpose

This document assesses and documents HeyConcierge's compliance obligations under Regulation (EU) 2024/1689 — the **EU Artificial Intelligence Act** ("AI Act"), which entered into force on 1 August 2024 with phased application dates through 2027.

---

## 2. System Description

**System name:** HeyConcierge AI Concierge
**Function:** AI-powered chatbot that answers property guests' questions via Telegram and WhatsApp, using property information configured by hosts.
**Underlying AI model:** Anthropic Claude (general-purpose AI model accessed via API)
**Deployer:** HeyConcierge AS (deployer of the AI system within the meaning of Art. 3(4) AI Act)
**Provider of GPAI model:** Anthropic, PBC (provider of the general-purpose AI model under Art. 3(66) AI Act)

---

## 3. Risk Classification

### 3.1 Assessment

The AI Act establishes four risk tiers: Unacceptable (Art. 5), High-Risk (Art. 6, Annex III), Limited Risk / Transparency Obligations (Art. 50), and Minimal Risk.

**HeyConcierge is classified as a Limited Risk AI system** subject to **transparency obligations under Article 50**.

### 3.2 Why HeyConcierge Is NOT High-Risk

HeyConcierge does **not** fall within any of the high-risk categories listed in Annex III of the AI Act:

| Annex III Category | Applicability | Reasoning |
|---------------------|--------------|-----------|
| 1. Biometrics | ❌ Not applicable | No biometric identification or categorisation |
| 2. Critical infrastructure | ❌ Not applicable | Not used in energy, water, transport, or digital infrastructure |
| 3. Education and vocational training | ❌ Not applicable | No educational assessment or admission decisions |
| 4. Employment, workers management | ❌ Not applicable | No recruitment, evaluation, or workforce management |
| 5. Access to essential services | ❌ Not applicable | No credit scoring, insurance, or social benefit decisions |
| 6. Law enforcement | ❌ Not applicable | No law enforcement use |
| 7. Migration, asylum, border control | ❌ Not applicable | No immigration-related use |
| 8. Administration of justice | ❌ Not applicable | No judicial or democratic process use |

**Additionally:**
- HeyConcierge does not make decisions that produce **legal effects** or **significantly affect** natural persons (Art. 6(2) threshold).
- The system provides **informational responses** only (property information, check-in instructions, local recommendations). It does not make autonomous decisions, approve/deny services, or assess individuals.
- Guests can always contact the host directly for human assistance.

### 3.3 Why Transparency Obligations Apply (Art. 50)

Article 50(1) of the AI Act requires that deployers of AI systems designed to **interact directly with natural persons** ensure that those persons are **informed that they are interacting with an AI system**, unless this is obvious from the circumstances.

HeyConcierge's concierge bot interacts directly with guests via messaging platforms. It is not always obvious to a guest that they are communicating with an AI rather than a human. Therefore, **Article 50 transparency obligations apply**.

---

## 4. Compliance Measures

### 4.1 Transparency (Art. 50)

**Obligation:** Inform persons that they are interacting with an AI system.

**Implementation:**
1. **AI disclosure in bot welcome message** — The concierge bot's initial message to each guest clearly states that it is an AI-powered assistant. Templates are provided in multiple languages (see AI Disclosure Templates).
2. **Host contractual obligation** — The Terms of Service (Clause 8.1) require hosts to ensure guests are informed they are communicating with an AI-powered service.
3. **Guest privacy notice** — A standard guest privacy notice (see Guest Privacy Notice) includes information about AI processing.

### 4.2 General-Purpose AI Model (GPAI) Obligations

HeyConcierge uses Anthropic's Claude, which is a **general-purpose AI model** under Art. 3(63) AI Act. The obligations for GPAI model providers (Art. 53–55) fall on **Anthropic as the provider**, not on HeyConcierge as the deployer.

HeyConcierge's responsibilities as a **deployer** using a GPAI model:
- Use the model in accordance with its intended purpose and Anthropic's usage policies ✅
- Implement appropriate transparency measures for end users ✅
- Monitor for and mitigate foreseeable misuse ✅

### 4.3 No Prohibited Practices (Art. 5)

HeyConcierge does **not** engage in any prohibited AI practices:
- ❌ No subliminal manipulation
- ❌ No exploitation of vulnerabilities (age, disability, social/economic situation)
- ❌ No social scoring
- ❌ No real-time biometric identification
- ❌ No emotion recognition in workplace or education
- ❌ No predictive policing based on profiling

### 4.4 Content Marking (Art. 50(2))

HeyConcierge does not generate synthetic audio, image, video, or text that could be mistaken for authentic human-generated content intended to inform the public about matters of public interest. The AI generates **property-specific informational responses** in a clearly disclosed AI context. Full Art. 50(2) content-marking obligations (e.g., watermarking) are therefore not applicable.

---

## 5. Documentation and Record-Keeping

In accordance with general AI governance best practices and Art. 26 (obligations of deployers of high-risk AI systems, applied here voluntarily as good practice):

| Document | Status | Location |
|----------|--------|----------|
| AI Act risk classification | ✅ This document | `legal/AI_ACT_COMPLIANCE.md` |
| DPIA | ✅ Completed | `legal/DPIA.md` |
| AI disclosure templates | ✅ Created | `legal/AI_DISCLOSURE_TEMPLATES.md` |
| Guest privacy notice | ✅ Created | `legal/GUEST_PRIVACY_NOTICE.md` |
| Transparency in ToS | ✅ Clause 8.1 | `legal/TERMS_OF_SERVICE.md` |
| Anthropic usage policy compliance | ✅ Reviewed | Anthropic Acceptable Use Policy |

---

## 6. Timeline and Applicability

| AI Act Provision | Application Date | HeyConcierge Status |
|-----------------|-----------------|-------------------|
| Prohibited practices (Art. 5) | 2 February 2025 | ✅ Compliant — no prohibited practices |
| GPAI model obligations (Art. 53–55) | 2 August 2025 | ℹ️ Anthropic's responsibility as GPAI provider |
| Transparency for AI systems (Art. 50) | 2 August 2026 | ✅ Already implemented (ahead of deadline) |
| High-risk AI system obligations | 2 August 2026 | ℹ️ Not applicable — not high-risk |

---

## 7. Review

This assessment will be reviewed:
- **Annually** (next: February 2027)
- When there are **material changes** to the AI system, underlying model, or use case
- When **delegated acts or guidance** from the European Commission or AI Office provide further clarification on transparency obligations

---

**Approved by:** HeyConcierge AS
**Date:** February 2026
**Contact:** hello@heyconcierge.io
