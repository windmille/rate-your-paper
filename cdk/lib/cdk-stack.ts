import * as cdk from 'aws-cdk-lib';
import { AuthorizationType, Definition, GraphqlApi, KeyCondition, MappingTemplate, PrimaryKey, Values } from 'aws-cdk-lib/aws-appsync';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { AttributeType, Billing, Capacity, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { Construct } from 'constructs';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';

const PK = 'doi';
const SK = 'timestamp';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const papersTable = new TableV2(this, 'PapersTable', {
      tableName: 'PapersTable',
      partitionKey: {
        name: PK,
        type: AttributeType.STRING,
      },
      sortKey: {
        name: SK,
        type: AttributeType.NUMBER,
      },
      billing: Billing.provisioned({
        readCapacity: Capacity.fixed(1),
        writeCapacity: Capacity.autoscaled({
          seedCapacity: 1,
          maxCapacity: 2,
        }),
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new GraphqlApi(this, 'PapersCommentApi', {
      name: 'papers-comment-api',
      definition: Definition.fromFile('../graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.IAM,
          },
        ],
      },
    });

    const papersDataSource = api.addDynamoDbDataSource('PapersDataSource', papersTable);

    papersDataSource.createResolver('QueryPaperCommentsResolver', {
      typeName: 'Query',
      fieldName: 'queryPaperComments',
      requestMappingTemplate: MappingTemplate.dynamoDbQuery(KeyCondition.eq(PK, PK)),
      responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
    });

    papersDataSource.createResolver('AddPaperCommentResolver', {
      typeName: 'Mutation',
      fieldName: 'addPaperComment',
      requestMappingTemplate: MappingTemplate.fromString(`
        #set($input = $ctx.args)
        #set($doiRegex = "^10\\.\\d{4,9}/[-._;()/:A-Za-z0-9]+$")

        #if(!$util.matches($doiRegex, $ctx.args.doi))
          $util.error("Invalid DOI format. Must follow '10.xxxx/xxxxx'", "BadRequest")
        #end

        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key" : {
              "doi" : $util.dynamodb.toDynamoDBJson($ctx.args.doi),
              "timestamp" : $util.dynamodb.toDynamoDBJson($util.time.nowEpochMilliSeconds())
          },
          "attributeValues": $util.dynamodb.toMapValuesJson($input)
        }
      `),
      responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
    });

    const waf = new CfnWebACL(this, 'MyGlobalWafACL', {
      scope: 'REGIONAL', // Must be REGIONAL for AppSync
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'MyGlobalWafMetric',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'GlobalRateLimitRule',
          priority: 1,
          action: { block: {} }, // Block requests exceeding limit
          statement: {
            rateBasedStatement: {
              limit: 10, // Global Limit (Total Requests, Approximate)
              aggregateKeyType: 'IP',    
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: false,
            metricName: 'GlobalRateLimitMetric',
            sampledRequestsEnabled: false,
          },
        },
      ],
    });

    // Associate WAF with AppSync API
    new CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: api.arn, // Associate with the AppSync API
      webAclArn: waf.attrArn,
    });

    const amplifyApp = new amplify.App(this, 'PaperCommentApp', {
      environmentVariables: {
        REACT_APP_APPSYNC_URL: api.graphqlUrl,
        REACT_APP_APPSYNC_API_KEY: api.apiKey!,
      },
    });

    amplifyApp.addBranch('main');
  };
}
