# Privacy Policy

**Last updated: February 2026**

---

## 1. Introduction

Welcome to HeyConcierge. This Privacy Policy explains how HeyConcierge ("we", "us", "our") collects, uses, discloses, and protects personal data in connection with our AI-powered guest concierge platform.

HeyConcierge is operated by:

**HeyConcierge**
[PLACEHOLDER: Full legal company name]
[PLACEHOLDER: Street address]
Tromsø, Norway
Organisation number: [PLACEHOLDER: Norwegian organisation number]
Email: privacy@heyconcierge.io

We are committed to protecting your privacy and processing your personal data in compliance with the EU General Data Protection Regulation (GDPR), the Norwegian Personal Data Act (*Personopplysningsloven*), and any other applicable data protection legislation.

---

## 2. Scope and Roles

HeyConcierge operates a SaaS platform that enables property hosts ("Hosts") to deploy an AI-powered concierge chatbot for their guests ("Guests"). In this context:

- **HeyConcierge acts as a Data Controller** with respect to data collected directly from Hosts (e.g., account registration data) and usage data relating to our platform.
- **HeyConcierge acts as a Data Processor** on behalf of Hosts with respect to Guest personal data processed through the concierge service. Hosts are the Data Controllers for their Guests' data.
- **Guests** are the Data Subjects whose personal data is processed when they interact with the AI concierge.

This Privacy Policy addresses both categories of processing. If you are a Host seeking information about how your Guests' data is handled under the contract between us, please also refer to our [Data Processing Agreement](./DATA_PROCESSING_AGREEMENT.md).

---

## 3. Data We Collect

### 3.1 Host Data

When a Host registers for and uses HeyConcierge, we collect:

| Category | Examples |
|---|---|
| Identity data | Full name, company or trading name |
| Contact data | Email address |
| Account credentials | Password (hashed), Google OAuth tokens |
| Billing data | Payment method details (processed by Stripe; we do not store card numbers) |
| Property data | Property name, description, house rules, FAQs provided by the Host |
| Usage data | Log-in times, features used, support requests |

### 3.2 Guest Data

When Guests interact with the AI concierge deployed by a Host, we process on the Host's behalf:

| Category | Examples |
|---|---|
| Identity data | First name (where provided or inferred from the messaging platform) |
| Contact data | Phone number, Telegram user ID, WhatsApp number |
| Communication data | Message content sent to and received from the AI concierge |
| Metadata | Timestamps of messages, session identifiers |

We do not collect special categories of personal data (e.g., health data, political opinions) from Guests, and Hosts are prohibited from configuring the service in a way that would elicit such data.

### 3.3 Usage and Technical Data

For all users of our website and platform, we may collect:

- IP addresses and device/browser information
- Pages visited and actions taken on the platform (analytics)
- Error logs and performance data

---

## 4. Legal Basis for Processing

### 4.1 Host Data

| Purpose | Legal Basis |
|---|---|
| Account registration and service delivery | **Contract** (GDPR Art. 6(1)(b)) — necessary to perform the service agreement with the Host |
| Billing and payments | **Contract** (GDPR Art. 6(1)(b)) and **Legal obligation** (Art. 6(1)(c)) for accounting records |
| Service improvement and analytics | **Legitimate interests** (GDPR Art. 6(1)(f)) — to develop and improve our platform |
| Marketing communications | **Consent** (GDPR Art. 6(1)(a)) — where separately obtained; or **Legitimate interests** for direct marketing to existing customers |
| Legal compliance | **Legal obligation** (GDPR Art. 6(1)(c)) |

### 4.2 Guest Data

HeyConcierge processes Guest data on behalf of Hosts (as Processor). The Host is responsible for ensuring a valid legal basis applies. In practice, the typical legal basis is:

| Purpose | Likely Legal Basis |
|---|---|
| Responding to Guest enquiries via the AI concierge | **Legitimate interests** (GDPR Art. 6(1)(f)) — the Guest initiates contact and has a reasonable expectation that their messages will be processed to obtain a response; or **Contract** where the interaction forms part of the accommodation agreement |
| Storing conversation history for continuity | **Legitimate interests** (GDPR Art. 6(1)(f)) |

Hosts are responsible for informing Guests that an AI-powered concierge service is in use and for ensuring an appropriate legal basis applies.

---

## 5. How We Use Personal Data

### 5.1 Host Data

- To create and manage your HeyConcierge account
- To provide, operate, and maintain the platform
- To process subscription payments
- To send transactional communications (account alerts, invoices, service notices)
- To provide customer support
- To improve the platform and develop new features
- To comply with legal and regulatory obligations

### 5.2 Guest Data (as Processor)

- To receive and process incoming messages from Guests via Telegram or WhatsApp
- To generate AI-powered responses using the property information provided by the Host
- To maintain conversation context for the duration of a session
- To store conversation history for the retention period specified below
- To assist Hosts in responding to data subject access requests

We do **not** use Guest data to train our AI models, nor do we sell or rent Guest data to third parties.

---

## 6. Data Sharing and Third-Party Recipients

We share personal data with the following categories of recipients:

### 6.1 Sub-processors

We engage the following sub-processors to deliver the HeyConcierge service. All sub-processors are subject to contractual obligations consistent with GDPR requirements:

| Sub-processor | Role | Location | Transfer Mechanism |
|---|---|---|---|
| **Anthropic, PBC** | AI language model processing (Claude) | USA | Standard Contractual Clauses (SCCs) |
| **Supabase, Inc.** | Database hosting and storage | EU region | EEA — no transfer |
| **Vercel, Inc.** | Cloud hosting and infrastructure | USA | Standard Contractual Clauses (SCCs) |
| **Stripe, Inc.** | Payment processing | USA | Standard Contractual Clauses (SCCs) |
| **Google LLC** | OAuth authentication | USA | Standard Contractual Clauses (SCCs) |

An up-to-date list of sub-processors is maintained and available upon request at privacy@heyconcierge.io.

### 6.2 Other Disclosures

We may disclose personal data:

- To comply with a legal obligation, court order, or government request
- To protect the rights, property, or safety of HeyConcierge, our users, or the public
- In connection with a merger, acquisition, or sale of assets (with appropriate notice)

---

## 7. International Data Transfers

HeyConcierge is based in Norway, which is part of the European Economic Area (EEA). Some of our sub-processors are located outside the EEA, notably in the United States.

Where we transfer personal data to countries not recognised by the European Commission as providing an adequate level of data protection, we rely on **Standard Contractual Clauses (SCCs)** as approved by the European Commission, supplemented by a Transfer Impact Assessment where appropriate.

In particular, Guest message content is transmitted to Anthropic (USA) for AI processing. This transfer is covered by SCCs incorporated into our agreement with Anthropic. Only the data necessary to generate a response is transmitted; we do not instruct Anthropic to retain this data beyond the processing of each request.

---

## 8. Data Retention

| Data Category | Retention Period |
|---|---|
| Guest messages and conversation data | **90 days** from the date of each message, after which data is automatically deleted |
| Guest contact identifiers (phone, Telegram ID) | Deleted together with conversation data, or upon Host's account termination (whichever is earlier) |
| Host account data (name, email, company) | For the **duration of the service contract plus 2 years** after termination |
| Billing and transaction records | **5 years** from the date of transaction (Norwegian accounting law) |
| Usage and log data | **12 months**, rolling |

Upon termination of a Host's account, all Guest personal data associated with that account will be deleted within **30 days**.

---

## 9. Data Subject Rights

### 9.1 Rights of Hosts

As a Host (whose data we control directly), you have the following rights under GDPR:

- **Right of access** (Art. 15): Request a copy of the personal data we hold about you.
- **Right to rectification** (Art. 16): Request correction of inaccurate or incomplete data.
- **Right to erasure** (Art. 17): Request deletion of your personal data, subject to legal retention obligations.
- **Right to restriction** (Art. 18): Request that we restrict processing of your data in certain circumstances.
- **Right to data portability** (Art. 20): Receive your data in a structured, machine-readable format.
- **Right to object** (Art. 21): Object to processing based on legitimate interests.
- **Right to withdraw consent**: Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.

To exercise your rights, contact us at **privacy@heyconcierge.io**. We will respond within **30 days** (extendable by a further two months for complex requests, with notice).

### 9.2 Rights of Guests

Guests whose data is processed through the concierge service should direct their requests to the **Host** (the Data Controller), who is responsible for facilitating data subject rights. HeyConcierge will assist Hosts in responding to such requests as required under our Data Processing Agreement.

Guests may also contact HeyConcierge directly at privacy@heyconcierge.io, and we will direct the request to the relevant Host.

---

## 10. Security

We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss, destruction, or alteration, including:

- **Encryption in transit**: All data transmitted between users and our platform is encrypted using TLS.
- **Encryption at rest**: Data stored in our database is encrypted at rest.
- **Access controls**: Access to personal data is restricted to authorised personnel on a need-to-know basis.
- **Multi-factor authentication (MFA)**: Required for all administrative access to production systems.
- **Regular security reviews**: We conduct periodic assessments of our security posture.

In the event of a personal data breach that is likely to result in a risk to the rights and freedoms of individuals, we will notify the relevant supervisory authority within **72 hours** and affected data subjects without undue delay where required.

---

## 11. Cookies and Tracking

Our website and platform use cookies and similar technologies. A separate Cookie Policy is available at [PLACEHOLDER: URL to Cookie Policy]. You may manage cookie preferences through your browser settings or our cookie consent tool.

---

## 12. Children's Data

HeyConcierge is not directed at children under the age of 16, and we do not knowingly collect personal data from children. If you believe we have inadvertently collected such data, please contact privacy@heyconcierge.io and we will delete it promptly.

---

## 13. Automated Decision-Making

The AI concierge service generates automated responses to Guest messages. These responses are informational in nature (e.g., answering questions about a property). We do not make automated decisions about individuals that produce legal or similarly significant effects without human review.

---

## 14. Supervisory Authority

If you believe that our processing of your personal data violates applicable law, you have the right to lodge a complaint with the Norwegian Data Protection Authority:

**Datatilsynet**
Postboks 458 Sentrum
0105 Oslo, Norway
Website: [www.datatilsynet.no](https://www.datatilsynet.no)
Email: postkasse@datatilsynet.no

You may also lodge a complaint with the supervisory authority in your country of residence or place of work.

---

## 15. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will be communicated to Hosts by email or via a notice on our platform at least **30 days** before taking effect. The "Last updated" date at the top of this document reflects the most recent revision.

We encourage you to review this policy periodically.

---

## 16. Contact Us

For any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:

**Data Protection Contact**
HeyConcierge
Email: **privacy@heyconcierge.io**
[PLACEHOLDER: Postal address]
Tromsø, Norway

We aim to respond to all enquiries within **5 business days**.

---

*This Privacy Policy is governed by the laws of Norway and the EU General Data Protection Regulation (GDPR).*
