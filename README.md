# Business Report AI Generator

## Overview
This Cloudflare Worker generates an intelligent business report using AI-powered insights based on your current and target business metrics.

## API Endpoint Usage

### Request Payload
Send a POST request with the following JSON structure:

```json
{
  "currentAnnualRevenue": 500000,
  "targetAnnualRevenue": 750000,
  "currentProfitMargin": 0.15,
  "targetProfitMarginImprovement": 0.20
}