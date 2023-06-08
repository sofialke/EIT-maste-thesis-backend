#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FinancialAnalysisToolStack } from '../lib/financial-analysis-tool-stack';

const app = new cdk.App();
new FinancialAnalysisToolStack(app, 'FinancialAnalysisToolBackend', {
  env: {
    region: 'eu-central-1'
  },
});
