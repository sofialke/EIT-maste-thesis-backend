import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from 'aws-cdk-lib/aws-events';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { TextractDocument, TextractExpense } from "amazon-textract-response-parser";
import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
export class FinancialAnalysisToolStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps){
        super(scope, id, props);

        // API Gateway
        const api = new apigateway.RestApi(this, 'financial-tool-api', {
            binaryMediaTypes: ['*/*']
        });

        const apiKey = api.addApiKey('api-key-fin', {
            apiKeyName: 'api-key-fin',
        });

        const executeRole = new iam.Role(this, "role", {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            path: "/service-role/"
        });

        //const kmsKey = new kms.Key(this, 's3BucketKMSKey1');

        const balanceSheetBucket = new s3.Bucket(this, 'balanceSheetBucket', {
            //objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
            //blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            //encryptionKey: kmsKey,
        });

        balanceSheetBucket.grantReadWrite(executeRole);

        const incomeStatementBacket = new s3.Bucket(this, 'incomeStatementBacket', {
            //objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            //blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            //encryptionKey: kmsKey,
        });

        incomeStatementBacket.grantReadWrite(executeRole);

        const cashFlowBacket = new s3.Bucket(this, 'cashFlowBacket', {
            //objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            //blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            //encryptionKey: kmsKey,
        });

        cashFlowBacket.grantReadWrite(executeRole);

        const s3PutMeditationsPolicy = new iam.PolicyStatement({
            actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject'],
            resources: ['arn:aws:s3:::balanceSheetBacket/*',
                'arn:aws:s3:::incomeStatementBacket/*',
                'arn:aws:s3:::cashFlowBacket/*']
        })

        const balanceSheet = api.root.addResource('balanceSheet');
        const incomeStatement = api.root.addResource('incomeStatement');
        const cashFlow = api.root.addResource('cashFlow');

        const balanceSheetTable = new dynamodb.Table(this, 'balanceSheets', {
            tableName: 'BalanceSheet',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER},
            removalPolicy: RemovalPolicy.RETAIN
        });
        const incomeStatementTable = new dynamodb.Table(this, 'incomeStatements', {
            tableName: 'IncomeStatement',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER},
            removalPolicy: RemovalPolicy.RETAIN
        });
        const cashFlowTable = new dynamodb.Table(this, 'cashFlows', {
            tableName: 'CashFlow',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER},
            removalPolicy: RemovalPolicy.RETAIN
        });

        const saveBalanceSheetData = new lambda.Function(this, 'saveBalanceSheetData', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../functions/balanceSheet')),
            timeout: Duration.seconds(120),
            environment: {
                DYNAMODB_TABLE: balanceSheetTable.tableName
            },
            memorySize: 3008,
        });


        saveBalanceSheetData.role?.attachInlinePolicy(new iam.Policy(this, 's3-write-access-balance', {
            statements: [s3PutMeditationsPolicy]
        }));

        const saveIncomeStatementData = new lambda.Function(this, 'saveIncomeStatementData', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../functions/incomeStatement')),
            timeout: Duration.seconds(120),
            environment: {
                DYNAMODB_TABLE: incomeStatementTable.tableName
            },

            memorySize: 3008,
        });

        saveBalanceSheetData.role?.attachInlinePolicy(new iam.Policy(this, 's3-write-access-income', {
            statements: [s3PutMeditationsPolicy]
        }));

        const saveCashFlowData = new lambda.Function(this, 'saveCashFlowData', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../functions/cashFlow')),
            timeout: Duration.seconds(120),
            environment: {
                DYNAMODB_TABLE: cashFlowTable.tableName
            },
            memorySize: 3008,
        });

        saveBalanceSheetData.role?.attachInlinePolicy(new iam.Policy(this, 's3-write-access-cash', {
            statements: [s3PutMeditationsPolicy]
        }));

        balanceSheetTable.grantReadWriteData(saveBalanceSheetData);
        incomeStatementTable.grantReadWriteData(saveIncomeStatementData);
        cashFlowTable.grantReadWriteData(saveCashFlowData);

        const saveBalanceSheetDataIntegration = new apigateway.LambdaIntegration(saveBalanceSheetData);
        const saveIncomeStatementIntegration = new apigateway.LambdaIntegration(saveIncomeStatementData);
        const saveCashFlowIntegration = new apigateway.LambdaIntegration(saveCashFlowData);

        // Lambda layer
        //const soxLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'sox-lambda-layer', 'arn:aws:lambda:eu-central-1:893411983754:layer:sox-node10:1');
        //createMeditationFunction.addLayers(soxLayer);

        const balanceSheetPostMethod = balanceSheet.addMethod('PUT', saveBalanceSheetDataIntegration, {
            apiKeyRequired: true,

        });

        const incomeStatementPostMethod = incomeStatement.addMethod('PUT', saveIncomeStatementIntegration, {
            apiKeyRequired: true
        });

        const cashFlowPostMethod = cashFlow.addMethod('PUT', saveCashFlowIntegration, {
            apiKeyRequired: true
        });

        const plan = api.addUsagePlan('UsagePlan', {
            name: 'standardUsagePlan',
            quota: {
                limit: 1000,
                period: apigateway.Period.DAY
            },
            throttle: {
                burstLimit: 100,
                rateLimit: 100,
            }
        });

        plan.addApiKey(apiKey);

        const throttlingSettings = [balanceSheetPostMethod, incomeStatementPostMethod, cashFlowPostMethod].map(elem => {
            return {
                method: elem,
                throttle: {
                    burstLimit: 1000,
                    rateLimit: 1000,
                }
            }
        });
        plan.addApiStage({
            stage: api.deploymentStage,
            throttle: throttlingSettings
        });

        // EventBridge
        const eventBus = new events.EventBus(this, 'financialAnalysisToolBus');

        const cloudWatchLogGroup = new logs.LogGroup(this, 'eventBridgeLogGroup', {
            logGroupName: 'financialLogs',
            retention: logs.RetentionDays.THREE_MONTHS
        });

        new events.Rule(this, 'cloudWatchRule', {
            eventBus: eventBus,
            eventPattern: {
                source: [{ prefix: ''}] as any[]
            },
            targets: [
                new targets.CloudWatchLogGroup(cloudWatchLogGroup)
            ]
        })

    }
}
