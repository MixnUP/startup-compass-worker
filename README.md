## API Endpoint Usage
https://business-report-worker.adriane-loquinte.workers.dev

### Comprehensive Business Analysis Endpoint

#### Endpoint
`POST /business-analysis`

#### Request Payload
Send a POST request with the following JSON structure:

```json
{
  "businessName": "Example Tech Solutions",
  "industry": "Technology",
  "businessScale": "Small",
  "location": "San Francisco, CA",
  "currentAnnualRevenue": 500000,
  "targetAnnualRevenue": 750000,
  "currentProfitMargin": 0.15,
  "targetProfitMargin": 0.20,
  "businessGoals": "Expand market share and develop new product lines",
  "keyChallenges": "Limited marketing budget and intense competition"
}