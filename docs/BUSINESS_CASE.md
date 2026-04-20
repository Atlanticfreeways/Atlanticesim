# Business Case: Inventory Strategy and ROI Analysis

Atlantic eSIM is a global aggregator of eSIM services. This document explains the platform's inventory and the financial model for return on investment (ROI).

## 1. Inventory Landscape

Atlantic operates as an aggregator that combines wholesale inventories into a single pool.

### Aggregation Profile
- Upstream Providers: Airalo, eSIM Go, Maya Mobile, eSIMCard, Breeze, Holafly.
- Country Coverage: 190 plus Countries.
- Network Tiers: 4G/LTE as standard, 5G enabled in 45 jurisdictions.
- Inventory Depth: about 1,500 unique data packages.

### Smart-Select Optimization
The platform benchmarks packages instead of just listing them.
- Dynamic Tiering: Packages are grouped by data amount such as 1GB or 5GB.
- Cost Benchmarking: The system identifies the lowest-cost wholesale route across all providers in real-time.
- Yield Capture: By choosing the Best Value route, the platform captures the maximum spread between wholesale cost and standard retail pricing.

---

## 2. ROI Model and Unit Economics

The Atlantic ROI is driven by two main factors: Yield Optimization and Retention Intelligence.

### Lever A: Yield Optimization
- Average Retail Price: $12.00 for 3GB
- Weighted Wholesale Cost: $7.50
- Base Margin: 37.5 percent
- Smart-Select Lift: By routing activations to the cheapest wholesale provider, the platform achieves an additional 4 to 7 percent margin improvement.

### Lever B: AI-Driven Growth
Traditional eSIM platforms lose many users when data is exhausted. Atlantic prevents this:
- Usage Prediction: The service forecasts the date of data exhaustion.
- Automated Retention: Notifications trigger top-ups before the user loses connectivity.
- Projected LTV Lift: Targeted top-up triggers are projected to increase Lifetime Value by 18 to 22 percent.

### Lever C: B2B Wholesale Margins
For Business Partners, Atlantic works as a clearing house:
- Wholesale Margin: Configurable spread applied to partner activations.
- Float Revenue: Partner wallet deposits provide internal liquidity for provisioning.

---

## 3. Year 1 Financial Roadmap and Projections

This roadmap outlines the growth of the user base and revenue through Month 12.

| Phase | Duration | User Target | Focus Area | Projected Net Profit |
| :--- | :--- | :--- | :--- | :--- |
| Q1 Launch | Months 1-3 | 50 | Stable Launch and Testing | $462.00 |
| Q2 Growth | Months 4-6 | 250 | Acquisition and Reseller Onboarding | $4,500.00 |
| Q3 Scale | Months 7-9 | 750 | Expanded API Integrations | $12,000.00 |
| Q4 Dominance | Months 10-12 | 1,500 plus | Personalization and Retention | $35,000.00 plus |

---

## 4. Quantitative Projections

This model projects the Monthly Net Profit after accounting for wholesale costs, transaction fees, and cloud deployment overhead.

| User Tiers | Monthly Revenue | Wholesale Cost | Payment Fees | Server and DB | Net Monthly Profit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 50 Users | $600.00 | $375.00 | $21.00 | $30.00 | $174.00 |
| 100 Users | $1,200.00 | $750.00 | $42.00 | $30.00 | $378.00 |
| 500 Users | $6,000.00 | $3,750.00 | $210.00 | $55.00 | $1,985.00 |

Note: Infrastructure costs are based on high-efficiency cloud models.

---

## 5. Infrastructure and Deployment Analysis

Atlantic is designed for high-availability cloud deployment.

### Option A: AWS Lightsail
- Application Instance: 2GB RAM / 1 vCPU at $10.00 per month.
- Managed PostgreSQL: 1GB RAM at $15.00 per month.
- SSL and DNS: Managed via Cloud Provider at about $1.00 per month.
- Monthly Infrastructure Total: about $26.00.

### Option B: DigitalOcean
- Basic Droplet: 2GB RAM / 1 vCPU at $12.00 per month.
- Managed Database: PostgreSQL 15 at $15.00 per month.
- Object Storage: For logs and QR codes at $5.00 per month.
- Monthly Infrastructure Total: about $32.00.

### Initial Launch Capital
To launch the production instance, the following startup expenses are required:
- Domain Purchase: $15.00 annually.
- Provider Security Deposits: $0 to $500.00 depending on the provider.
- Estimated Launch Capital: $15.00 to $515.00.

---

## 6. Investor and Partnership Planning

Atlantic offers clear roles for strategic investment.

### Breakeven Analysis
Based on fixed costs of about $45 per month and a margin of about $4.10 per activation, the platform reaches cash-flow neutrality at 11 activations per month.

### Partnership Tiers
1. Seed Investor: Capital for scaling liquidity and marketing.
2. Strategic Partner: Business partners who use the Atlantic API for their own apps.
3. Technology Partner: Providers who integrate into the Atlantic aggregator.

### Exit Strategy
The platform is built on an automated codebase. The primary strategy is acquisition by a large telecommunications company looking to modernize their eSIM distribution.

---

## 7. Seed Round Strategy

Atlantic is targeting a Seed Round of $50,000 to be used as follows:
1. Market Acquisition (40 percent): $20,000 for marketing to travelers and resellers.
2. Liquidity and Float (30 percent): $15,000 for provider wallet balances to ensure uptime.
3. Operational Runway (30 percent): $15,000 for maintenance and new integrations.

---

## 8. Risk Management and Regulations

Atlantic takes a proactive approach to risk management.
- Provider Dependency: The multi-adapter architecture ensures service even if one provider fails.
- Regulatory Shifts: The platform can adapt to new identity verification requirements in different countries.
- Margin Compression: The optimization engine finds the lowest-cost path to protect profits.

---

## 9. Deployment Guide

Follow these steps for a production launch on AWS or DigitalOcean:

### Step 1: Server Setup
- Create a 2GB RAM / 1 vCPU instance.
- Enable a static IP and update your Domain records.

### Step 2: Database Setup
- Start a Managed PostgreSQL 15 instance.
- Run the provided database migration commands.

### Step 3: Deployment
- Push your Docker images to a registry.
- Pull the images to the production server and start the containers.

### Step 4: Security
- Configure SSL certificates.
- Update all production secrets in the environment file.

---

## 10. Inventory Scalability

The architecture allows for adding new providers without changing the core system. As the platform scales, direct agreements with mobile network operators can further improve margins.

---

## Conclusion

Atlantic is a financial gateway for connectivity. The combination of multi-provider liquidity and cost routing creates a high-margin business asset.
