import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
export class FinancialAnalysisToolStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps){
        super(scope, id, props);

        // API Gateway
        const api = new apigateway.RestApi(this, 'meditate-api');

        const apiKey = api.addApiKey('api-key', {
            apiKeyName: 'api-key',
        });


        const balanceSheetBacket = new s3.Bucket(this, 'balanceSheetBacket', {
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryptionKey: new kms.Key(this, 's3BucketKMSKey'),
        });

        balanceSheetBacket.grantReadWrite(new iam.AccountRootPrincipal());

        const financialStatementBacket = new s3.Bucket(this, 'financialStatementBacket', {
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryptionKey: new kms.Key(this, 's3BucketKMSKey'),
        });

        balanceSheetBacket.grantReadWrite(new iam.AccountRootPrincipal());

        const balanceSheet = api.root.addResource('balanceSheet');
        const financialStatement = api.root.addResource('financialStatement');
        const cashflow = api.root.addResource('cashFlow');

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



    }
}
const app = new cdk.App();
new FinancialAnalysisToolStack(app, 'FinancialAnalysisToolStack');
app.synth();
