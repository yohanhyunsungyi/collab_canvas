# AWS Hybrid Backend 구축 계획 (Greenfield)

## 아키텍처 개요

### 하이브리드 구조
```
┌─────────────────────────────────────────────────────────────┐
│                   AWS Amplify Hosting                        │
│              (React App - Static Files)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼────────┐
│   Firebase   │  │  API Gateway │  │   AppSync    │
│     Auth     │  │   (REST)     │  │  (GraphQL)   │
└──────────────┘  └──────┬───────┘  └──────┬───────┘
                         │                  │
                  ┌──────▼──────┐    ┌─────▼──────┐
                  │   Lambda    │    │  Lambda    │
                  │  Functions  │    │  Resolver  │
                  └──────┬───────┘    └─────┬──────┘
                         │                  │
        ┌────────────────┼──────────────────┘
        │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────────────┐
│  DynamoDB    │  │  Firebase   │  │   OpenAI     │
│  (Canvas,    │  │  Realtime   │  │     API      │
│  Comments)   │  │  (Cursors)  │  │              │
└──────────────┘  └─────────────┘  └──────────────┘
```

### 역할 분담

**Firebase (유지)**:
- Authentication: 사용자 로그인/회원가입
- Realtime Database: 커서 위치, 사용자 Presence (빠른 실시간 동기화 필요)

**AWS (신규 구축)**:
- DynamoDB: Canvas 객체, Comments (영구 저장)
- Lambda + API Gateway: CRUD API
- AppSync: Canvas 객체 실시간 구독
- Amplify Hosting: 프론트엔드 배포

---

## Phase 1: AWS 인프라 초기 설정 (Day 1-2)

### Task 1.1: AWS 계정 및 CLI 설정
**시간**: 1시간

- [ ] AWS 계정 생성/확인
- [ ] IAM 사용자 생성
  - 권한: AdministratorAccess (개발용)
  - 프로그래밍 액세스 활성화
- [ ] AWS CLI 설치
  ```bash
  # macOS
  brew install awscli
  
  # 구성
  aws configure
  # AWS Access Key ID: [입력]
  # AWS Secret Access Key: [입력]
  # Default region: 미국 중부
  # Default output format: json
  ```
- [ ] 자격 증명 테스트
  ```bash
  aws sts get-caller-identity
  ```

**산출물**:
- AWS CLI 설정 완료
- IAM 자격 증명 저장

---

### Task 1.2: DynamoDB 테이블 생성
**시간**: 2시간

#### 테이블 1: `CollabCanvas-CanvasObjects`

**스키마 설계**:
```typescript
{
  canvasId: string,        // Partition Key
  objectId: string,        // Sort Key
  type: 'rectangle' | 'circle' | 'text' | 'image',
  x: number,
  y: number,
  width?: number,
  height?: number,
  radius?: number,
  color: string,
  text?: string,
  fontSize?: number,
  imageUrl?: string,
  rotation: number,
  zIndex: number,
  createdBy: string,       // userId
  lockedBy?: string,       // userId
  createdAt: number,       // timestamp
  updatedAt: number        // timestamp
}
```

**CLI 명령어**:
```bash
aws dynamodb create-table \
  --table-name CollabCanvas-CanvasObjects \
  --attribute-definitions \
    AttributeName=canvasId,AttributeType=S \
    AttributeName=objectId,AttributeType=S \
    AttributeName=createdBy,AttributeType=S \
    AttributeName=createdAt,AttributeType=N \
  --key-schema \
    AttributeName=canvasId,KeyType=HASH \
    AttributeName=objectId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"UserObjectsIndex\",\"KeySchema\":[{\"AttributeName\":\"createdBy\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ap-northeast-2
```

**태스크**:
- [ ] 테이블 생성
- [ ] GSI 확인: `UserObjectsIndex`
- [ ] On-Demand 결제 모드 확인
- [ ] 테이블 상태 확인
  ```bash
  aws dynamodb describe-table --table-name CollabCanvas-CanvasObjects
  ```

#### 테이블 2: `CollabCanvas-Comments`

**스키마**:
```typescript
{
  canvasId: string,        // Partition Key
  commentId: string,       // Sort Key
  objectId?: string,       // 연결된 객체 ID
  text: string,
  author: string,          // userId
  authorName: string,
  x: number,
  y: number,
  resolved: boolean,
  replies: Array<{
    id: string,
    text: string,
    author: string,
    authorName: string,
    createdAt: number
  }>,
  createdAt: number,
  updatedAt: number
}
```

**CLI 명령어**:
```bash
aws dynamodb create-table \
  --table-name CollabCanvas-Comments \
  --attribute-definitions \
    AttributeName=canvasId,AttributeType=S \
    AttributeName=commentId,AttributeType=S \
  --key-schema \
    AttributeName=canvasId,KeyType=HASH \
    AttributeName=commentId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

**태스크**:
- [ ] 테이블 생성
- [ ] 테이블 상태 확인

**산출물**:
- DynamoDB 테이블 2개 생성 완료
- 테이블 ARN 기록

---

### Task 1.3: Amplify CLI 초기화
**시간**: 1시간

```bash
# Amplify CLI 설치
npm install -g @aws-amplify/cli

# 프로젝트 디렉토리에서 초기화
cd /Users/yohanyi/Desktop/GauntletAI/01_CollabCanvas
amplify init
```

**초기화 설정**:
```
? Enter a name for the project: CollabCanvas
? Enter a name for the environment: dev
? Choose your default editor: Visual Studio Code
? Choose the type of app: javascript
? What javascript framework: react
? Source Directory Path: src
? Distribution Directory Path: dist
? Build Command: npm run build
? Start Command: npm run dev
? Do you want to use an AWS profile? Yes
? Please choose the profile: default
```

**태스크**:
- [ ] Amplify CLI 설치
- [ ] 프로젝트 초기화
- [ ] `amplify/` 폴더 생성 확인
- [ ] `.amplifyrc` 파일 확인

**산출물**:
- `amplify/` 폴더
- Amplify 환경 구성 완료

---

## Phase 2: 백엔드 Lambda 함수 개발 (Day 3-5)

### Task 2.1: 프로젝트 구조 생성
**시간**: 30분

**디렉토리 구조**:
```
backend/
├── src/
│   ├── functions/
│   │   ├── canvas/
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── list.ts
│   │   ├── comments/
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   └── delete.ts
│   │   ├── auth/
│   │   │   └── authorizer.ts
│   │   └── ai/
│   │       ├── execute.ts
│   │       └── history.ts
│   ├── lib/
│   │   ├── dynamodb.ts
│   │   ├── firebase-admin.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── config/
│       └── constants.ts
├── package.json
├── tsconfig.json
└── serverless.yml
```

**명령어**:
```bash
mkdir -p backend/src/{functions/{canvas,comments,auth,ai},lib,config}
cd backend
npm init -y
```

**태스크**:
- [ ] 디렉토리 구조 생성
- [ ] `package.json` 초기화

---

### Task 2.2: 의존성 설치
**시간**: 15분

```bash
cd backend

# 런타임 의존성
npm install \
  aws-sdk \
  firebase-admin \
  openai \
  uuid

# 개발 의존성
npm install -D \
  @types/node \
  @types/aws-lambda \
  typescript \
  serverless \
  serverless-plugin-typescript \
  serverless-offline
```

**태스크**:
- [ ] 의존성 설치
- [ ] `tsconfig.json` 생성
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

**산출물**:
- `package.json` with dependencies
- `tsconfig.json`

---

### Task 2.3: DynamoDB 헬퍼 라이브러리
**시간**: 1시간

**파일**: `backend/src/lib/dynamodb.ts`

```typescript
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

const TABLES = {
  CANVAS_OBJECTS: process.env.CANVAS_OBJECTS_TABLE || 'CollabCanvas-CanvasObjects',
  COMMENTS: process.env.COMMENTS_TABLE || 'CollabCanvas-Comments'
};

// Canvas Objects CRUD
export async function createCanvasObject(item: any) {
  return dynamodb.put({
    TableName: TABLES.CANVAS_OBJECTS,
    Item: {
      ...item,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }).promise();
}

export async function getCanvasObject(canvasId: string, objectId: string) {
  const result = await dynamodb.get({
    TableName: TABLES.CANVAS_OBJECTS,
    Key: { canvasId, objectId }
  }).promise();
  return result.Item;
}

export async function listCanvasObjects(canvasId: string) {
  const result = await dynamodb.query({
    TableName: TABLES.CANVAS_OBJECTS,
    KeyConditionExpression: 'canvasId = :canvasId',
    ExpressionAttributeValues: {
      ':canvasId': canvasId
    }
  }).promise();
  return result.Items || [];
}

export async function updateCanvasObject(
  canvasId: string, 
  objectId: string, 
  updates: any
) {
  const updateExpression: string[] = [];
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};

  Object.keys(updates).forEach((key, index) => {
    const placeholder = `:val${index}`;
    const namePlaceholder = `#attr${index}`;
    updateExpression.push(`${namePlaceholder} = ${placeholder}`);
    expressionAttributeValues[placeholder] = updates[key];
    expressionAttributeNames[namePlaceholder] = key;
  });

  expressionAttributeValues[':updatedAt'] = Date.now();
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  updateExpression.push('#updatedAt = :updatedAt');

  return dynamodb.update({
    TableName: TABLES.CANVAS_OBJECTS,
    Key: { canvasId, objectId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW'
  }).promise();
}

export async function deleteCanvasObject(canvasId: string, objectId: string) {
  return dynamodb.delete({
    TableName: TABLES.CANVAS_OBJECTS,
    Key: { canvasId, objectId }
  }).promise();
}

// Comments CRUD (similar pattern)
export async function createComment(item: any) { /* ... */ }
export async function getComment(canvasId: string, commentId: string) { /* ... */ }
export async function listComments(canvasId: string) { /* ... */ }
export async function updateComment(canvasId: string, commentId: string, updates: any) { /* ... */ }
export async function deleteComment(canvasId: string, commentId: string) { /* ... */ }
```

**태스크**:
- [ ] DynamoDB 헬퍼 함수 작성
- [ ] Canvas Objects CRUD (5개 함수)
- [ ] Comments CRUD (5개 함수)
- [ ] 타입 정의 (`lib/types.ts`)

---

### Task 2.4: Firebase Admin 초기화
**시간**: 30분

**파일**: `backend/src/lib/firebase-admin.ts`

```typescript
import * as admin from 'firebase-admin';

// 환경 변수에서 서비스 계정 키 로드
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// 토큰 검증
export async function verifyIdToken(token: string): Promise<string> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

export const firebaseAdmin = admin;
```

**태스크**:
- [ ] Firebase Admin SDK 초기화
- [ ] 토큰 검증 함수
- [ ] 서비스 계정 키 환경 변수 설정

**참고**: Firebase 서비스 계정 키는 Firebase Console → Project Settings → Service Accounts에서 생성

---

### Task 2.5: Lambda Authorizer 구현
**시간**: 1시간

**파일**: `backend/src/functions/auth/authorizer.ts`

```typescript
import { 
  APIGatewayAuthorizerResult, 
  APIGatewayTokenAuthorizerEvent 
} from 'aws-lambda';
import { verifyIdToken } from '../../lib/firebase-admin';

export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  try {
    // Authorization: Bearer <token>
    const token = event.authorizationToken.replace('Bearer ', '');
    const userId = await verifyIdToken(token);

    return generatePolicy(userId, 'Allow', event.methodArn);
  } catch (error) {
    console.error('Authorization failed:', error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
}

function generatePolicy(
  principalId: string, 
  effect: 'Allow' | 'Deny', 
  resource: string
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    },
    context: {
      userId: principalId
    }
  };
}
```

**태스크**:
- [ ] Lambda Authorizer 함수 작성
- [ ] Firebase 토큰 검증 통합
- [ ] Policy 생성 로직
- [ ] 에러 핸들링

---

### Task 2.6: Canvas Objects Lambda 함수 (CRUD)
**시간**: 3시간

#### 2.6.1: Create Canvas Object
**파일**: `backend/src/functions/canvas/create.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createCanvasObject } from '../../lib/dynamodb';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const canvasId = event.pathParameters?.canvasId || 'default';
    const body = JSON.parse(event.body || '{}');

    const objectId = uuidv4();
    const item = {
      canvasId,
      objectId,
      ...body,
      createdBy: userId,
      lockedBy: null
    };

    await createCanvasObject(item);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true, 
        objectId,
        item 
      })
    };
  } catch (error) {
    console.error('Error creating object:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
}
```

#### 2.6.2: Get Canvas Object
**파일**: `backend/src/functions/canvas/get.ts`

```typescript
// Similar pattern - GET single object
```

#### 2.6.3: List Canvas Objects
**파일**: `backend/src/functions/canvas/list.ts`

```typescript
// Similar pattern - GET all objects in canvas
```

#### 2.6.4: Update Canvas Object
**파일**: `backend/src/functions/canvas/update.ts`

```typescript
// Similar pattern - PUT/PATCH update
```

#### 2.6.5: Delete Canvas Object
**파일**: `backend/src/functions/canvas/delete.ts`

```typescript
// Similar pattern - DELETE
```

**태스크**:
- [ ] Create 함수 (POST)
- [ ] Get 함수 (GET)
- [ ] List 함수 (GET)
- [ ] Update 함수 (PUT)
- [ ] Delete 함수 (DELETE)
- [ ] 각 함수 에러 핸들링
- [ ] CORS 헤더 추가

---

### Task 2.7: Comments Lambda 함수 (CRUD)
**시간**: 2시간

동일한 패턴으로 Comments CRUD 구현:
- [ ] `backend/src/functions/comments/create.ts`
- [ ] `backend/src/functions/comments/get.ts`
- [ ] `backend/src/functions/comments/list.ts`
- [ ] `backend/src/functions/comments/update.ts`
- [ ] `backend/src/functions/comments/delete.ts`

---

### Task 2.8: AI Executor Lambda 함수
**시간**: 2시간

**파일**: `backend/src/functions/ai/execute.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import OpenAI from 'openai';
import { 
  createCanvasObject, 
  listCanvasObjects, 
  updateCanvasObject,
  deleteCanvasObject 
} from '../../lib/dynamodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI Tools Schema (기존 ai-tools.schema.ts에서 가져오기)
const tools = [
  {
    type: 'function',
    function: {
      name: 'createRectangle',
      description: 'Create a rectangle on the canvas',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          color: { type: 'string' }
        },
        required: ['x', 'y', 'width', 'height']
      }
    }
  },
  // ... 나머지 23개 도구
];

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const { command, canvasId } = JSON.parse(event.body || '{}');

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a canvas design assistant...' },
        { role: 'user', content: command }
      ],
      tools,
      tool_choice: 'auto'
    });

    // Tool Calls 실행
    const toolCalls = completion.choices[0].message.tool_calls || [];
    const results = [];

    for (const toolCall of toolCalls) {
      const result = await executeToolCall(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        canvasId,
        userId
      );
      results.push(result);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        results,
        message: completion.choices[0].message.content
      })
    };
  } catch (error) {
    console.error('AI execution error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}

async function executeToolCall(
  functionName: string,
  args: any,
  canvasId: string,
  userId: string
) {
  // Tool execution logic (기존 ai-executor.service.ts 로직)
  switch (functionName) {
    case 'createRectangle':
      return createCanvasObject({ 
        canvasId, 
        type: 'rectangle', 
        ...args, 
        createdBy: userId 
      });
    // ... 나머지 도구들
  }
}
```

**태스크**:
- [ ] OpenAI API 통합
- [ ] Tool Calls 실행 로직
- [ ] DynamoDB 연동
- [ ] 에러 핸들링

---

### Task 2.9: Serverless Framework 설정
**시간**: 2시간

**파일**: `backend/serverless.yml`

```yaml
service: collabcanvas-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  region: ap-northeast-2
  stage: ${opt:stage, 'dev'}
  environment:
    CANVAS_OBJECTS_TABLE: CollabCanvas-CanvasObjects
    COMMENTS_TABLE: CollabCanvas-Comments
    FIREBASE_DATABASE_URL: ${env:FIREBASE_DATABASE_URL}
    FIREBASE_SERVICE_ACCOUNT_KEY: ${env:FIREBASE_SERVICE_ACCOUNT_KEY}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource:
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CANVAS_OBJECTS_TABLE}
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.COMMENTS_TABLE}

functions:
  authorizer:
    handler: src/functions/auth/authorizer.handler

  # Canvas Objects
  createCanvasObject:
    handler: src/functions/canvas/create.handler
    events:
      - http:
          path: /canvas/{canvasId}/objects
          method: post
          authorizer: authorizer
          cors: true

  listCanvasObjects:
    handler: src/functions/canvas/list.handler
    events:
      - http:
          path: /canvas/{canvasId}/objects
          method: get
          authorizer: authorizer
          cors: true

  getCanvasObject:
    handler: src/functions/canvas/get.handler
    events:
      - http:
          path: /canvas/{canvasId}/objects/{objectId}
          method: get
          authorizer: authorizer
          cors: true

  updateCanvasObject:
    handler: src/functions/canvas/update.handler
    events:
      - http:
          path: /canvas/{canvasId}/objects/{objectId}
          method: put
          authorizer: authorizer
          cors: true

  deleteCanvasObject:
    handler: src/functions/canvas/delete.handler
    events:
      - http:
          path: /canvas/{canvasId}/objects/{objectId}
          method: delete
          authorizer: authorizer
          cors: true

  # Comments (similar pattern)
  createComment:
    handler: src/functions/comments/create.handler
    events:
      - http:
          path: /canvas/{canvasId}/comments
          method: post
          authorizer: authorizer
          cors: true

  # AI
  executeAICommand:
    handler: src/functions/ai/execute.handler
    timeout: 30
    events:
      - http:
          path: /ai/execute
          method: post
          authorizer: authorizer
          cors: true

plugins:
  - serverless-plugin-typescript
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 3001
```

**태스크**:
- [ ] Serverless Framework 설정 파일 작성
- [ ] 모든 Lambda 함수 정의
- [ ] IAM 권한 설정
- [ ] 환경 변수 설정
- [ ] CORS 설정

---

## Phase 3: AppSync GraphQL API 설정 (Day 6)

### Task 3.1: AppSync API 생성
**시간**: 30분

**AWS CLI**:
```bash
aws appsync create-graphql-api \
  --name CollabCanvas-API \
  --authentication-type API_KEY \
  --region ap-northeast-2
```

또는 AWS Console에서:
1. AppSync 콘솔 이동
2. "Create API" → "Build from scratch"
3. API 이름: `CollabCanvas-API`
4. Authorization: API Key (개발용)

**태스크**:
- [ ] AppSync API 생성
- [ ] API ID 기록
- [ ] API Key 생성 (개발용, 7일 유효)

---

### Task 3.2: GraphQL Schema 정의
**시간**: 1시간

**파일**: `backend/appsync-schema.graphql`

```graphql
type CanvasObject {
  canvasId: ID!
  objectId: ID!
  type: String!
  x: Float!
  y: Float!
  width: Float
  height: Float
  radius: Float
  color: String!
  text: String
  fontSize: Float
  rotation: Float!
  zIndex: Int!
  createdBy: String!
  lockedBy: String
  createdAt: AWSTimestamp!
  updatedAt: AWSTimestamp!
}

type Comment {
  canvasId: ID!
  commentId: ID!
  text: String!
  author: String!
  authorName: String!
  x: Float!
  y: Float!
  resolved: Boolean!
  createdAt: AWSTimestamp!
  updatedAt: AWSTimestamp!
}

type Query {
  getCanvasObject(canvasId: ID!, objectId: ID!): CanvasObject
  listCanvasObjects(canvasId: ID!): [CanvasObject]
  getComment(canvasId: ID!, commentId: ID!): Comment
  listComments(canvasId: ID!): [Comment]
}

type Mutation {
  createCanvasObject(input: CreateCanvasObjectInput!): CanvasObject
  updateCanvasObject(input: UpdateCanvasObjectInput!): CanvasObject
  deleteCanvasObject(canvasId: ID!, objectId: ID!): CanvasObject
  
  createComment(input: CreateCommentInput!): Comment
  updateComment(input: UpdateCommentInput!): Comment
  deleteComment(canvasId: ID!, commentId: ID!): Comment
}

type Subscription {
  onCanvasObjectCreated(canvasId: ID!): CanvasObject
    @aws_subscribe(mutations: ["createCanvasObject"])
  
  onCanvasObjectUpdated(canvasId: ID!): CanvasObject
    @aws_subscribe(mutations: ["updateCanvasObject"])
  
  onCanvasObjectDeleted(canvasId: ID!): CanvasObject
    @aws_subscribe(mutations: ["deleteCanvasObject"])
  
  onCommentCreated(canvasId: ID!): Comment
    @aws_subscribe(mutations: ["createComment"])
}

input CreateCanvasObjectInput {
  canvasId: ID!
  type: String!
  x: Float!
  y: Float!
  width: Float
  height: Float
  radius: Float
  color: String!
  text: String
  fontSize: Float
  rotation: Float
  zIndex: Int
  createdBy: String!
}

input UpdateCanvasObjectInput {
  canvasId: ID!
  objectId: ID!
  x: Float
  y: Float
  width: Float
  height: Float
  color: String
  rotation: Float
  zIndex: Int
  lockedBy: String
}

input CreateCommentInput {
  canvasId: ID!
  text: String!
  author: String!
  authorName: String!
  x: Float!
  y: Float!
}

input UpdateCommentInput {
  canvasId: ID!
  commentId: ID!
  text: String
  resolved: Boolean
}
```

**태스크**:
- [ ] GraphQL 스키마 작성
- [ ] 타입 정의: CanvasObject, Comment
- [ ] Query, Mutation, Subscription 정의
- [ ] Input 타입 정의
- [ ] AppSync Console에서 스키마 업로드

---

### Task 3.3: DynamoDB Data Source 연결
**시간**: 30분

**AWS Console**:
1. AppSync API → Data Sources
2. "Create data source"
3. Data source name: `CanvasObjectsTable`
4. Data source type: DynamoDB Table
5. Region: `ap-northeast-2`
6. Table name: `CollabCanvas-CanvasObjects`
7. Create new IAM role
8. Repeat for Comments table

**태스크**:
- [ ] CanvasObjectsTable Data Source 생성
- [ ] CommentsTable Data Source 생성
- [ ] IAM 역할 자동 생성 확인

---

### Task 3.4: Resolvers 생성
**시간**: 2시간

#### Resolver 1: Query.listCanvasObjects

**Request Mapping Template (VTL)**:
```vtl
{
  "version": "2017-02-28",
  "operation": "Query",
  "query": {
    "expression": "canvasId = :canvasId",
    "expressionValues": {
      ":canvasId": $util.dynamodb.toDynamoDBJson($ctx.args.canvasId)
    }
  }
}
```

**Response Mapping Template**:
```vtl
$util.toJson($ctx.result.items)
```

#### Resolver 2: Mutation.createCanvasObject

**Request Mapping Template**:
```vtl
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "canvasId": $util.dynamodb.toDynamoDBJson($ctx.args.input.canvasId),
    "objectId": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "x": $util.dynamodb.toDynamoDBJson($ctx.args.input.x),
    "y": $util.dynamodb.toDynamoDBJson($ctx.args.input.y),
    "color": $util.dynamodb.toDynamoDBJson($ctx.args.input.color),
    "rotation": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.rotation, 0)),
    "zIndex": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.zIndex, 0)),
    "createdBy": $util.dynamodb.toDynamoDBJson($ctx.args.input.createdBy),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowEpochMilliSeconds()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowEpochMilliSeconds())
  }
}
```

**태스크**:
- [ ] Query Resolvers (4개)
  - getCanvasObject
  - listCanvasObjects
  - getComment
  - listComments
- [ ] Mutation Resolvers (6개)
  - createCanvasObject
  - updateCanvasObject
  - deleteCanvasObject
  - createComment
  - updateComment
  - deleteComment
- [ ] 각 Resolver Request/Response 매핑 템플릿 작성

**참고**: AppSync Console → Schema → Resolvers에서 각 필드에 Resolver 연결

---

## Phase 4: 프론트엔드 통합 (Day 7-9)

### Task 4.1: AWS Amplify SDK 설치
**시간**: 15분

```bash
cd /Users/yohanyi/Desktop/GauntletAI/01_CollabCanvas
npm install aws-amplify @aws-amplify/api-graphql
```

**태스크**:
- [ ] 의존성 설치
- [ ] package.json 확인

---

### Task 4.2: Amplify 설정 파일 생성
**시간**: 30분

**파일**: `src/services/aws-config.ts`

```typescript
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    // Firebase Auth를 사용하므로 Cognito 설정 불필요
  },
  API: {
    aws_appsync_graphqlEndpoint: 'https://xxxxx.appsync-api.ap-northeast-2.amazonaws.com/graphql',
    aws_appsync_region: 'ap-northeast-2',
    aws_appsync_authenticationType: 'API_KEY',
    aws_appsync_apiKey: 'da2-xxxxxxxxxxxxxxxxx'
  },
  rest: {
    collabcanvas: {
      endpoint: 'https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/dev',
      region: 'ap-northeast-2'
    }
  }
};

Amplify.configure(awsConfig);

export default awsConfig;
```

**태스크**:
- [ ] AWS 설정 파일 작성
- [ ] AppSync GraphQL 엔드포인트 입력 (Phase 3에서 생성한 API)
- [ ] API Gateway REST 엔드포인트 입력 (Phase 2 배포 후)
- [ ] API Key 입력

**참고**: 실제 값은 배포 후 입력

---

### Task 4.3: GraphQL 쿼리/뮤테이션 정의
**시간**: 1시간

**파일**: `src/services/graphql/queries.ts`

```typescript
export const listCanvasObjects = /* GraphQL */ `
  query ListCanvasObjects($canvasId: ID!) {
    listCanvasObjects(canvasId: $canvasId) {
      canvasId
      objectId
      type
      x
      y
      width
      height
      radius
      color
      text
      fontSize
      rotation
      zIndex
      createdBy
      lockedBy
      createdAt
      updatedAt
    }
  }
`;

export const getCanvasObject = /* GraphQL */ `
  query GetCanvasObject($canvasId: ID!, $objectId: ID!) {
    getCanvasObject(canvasId: $canvasId, objectId: $objectId) {
      canvasId
      objectId
      type
      x
      y
      # ... 나머지 필드
    }
  }
`;
```

**파일**: `src/services/graphql/mutations.ts`

```typescript
export const createCanvasObject = /* GraphQL */ `
  mutation CreateCanvasObject($input: CreateCanvasObjectInput!) {
    createCanvasObject(input: $input) {
      canvasId
      objectId
      type
      x
      y
      width
      height
      color
      rotation
      zIndex
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const updateCanvasObject = /* GraphQL */ `
  mutation UpdateCanvasObject($input: UpdateCanvasObjectInput!) {
    updateCanvasObject(input: $input) {
      canvasId
      objectId
      x
      y
      width
      height
      color
      rotation
      zIndex
      updatedAt
    }
  }
`;

export const deleteCanvasObject = /* GraphQL */ `
  mutation DeleteCanvasObject($canvasId: ID!, $objectId: ID!) {
    deleteCanvasObject(canvasId: $canvasId, objectId: $objectId) {
      objectId
    }
  }
`;
```

**파일**: `src/services/graphql/subscriptions.ts`

```typescript
export const onCanvasObjectCreated = /* GraphQL */ `
  subscription OnCanvasObjectCreated($canvasId: ID!) {
    onCanvasObjectCreated(canvasId: $canvasId) {
      canvasId
      objectId
      type
      x
      y
      width
      height
      color
      rotation
      zIndex
      createdBy
      createdAt
    }
  }
`;

export const onCanvasObjectUpdated = /* GraphQL */ `
  subscription OnCanvasObjectUpdated($canvasId: ID!) {
    onCanvasObjectUpdated(canvasId: $canvasId) {
      canvasId
      objectId
      x
      y
      width
      height
      color
      rotation
      zIndex
      updatedAt
    }
  }
`;

export const onCanvasObjectDeleted = /* GraphQL */ `
  subscription OnCanvasObjectDeleted($canvasId: ID!) {
    onCanvasObjectDeleted(canvasId: $canvasId) {
      objectId
    }
  }
`;
```

**태스크**:
- [ ] Queries 정의 (2개)
- [ ] Mutations 정의 (3개)
- [ ] Subscriptions 정의 (3개)
- [ ] Comments 쿼리/뮤테이션 (동일 패턴)

---

### Task 4.4: Canvas Service 수정 (AppSync 통합)
**시간**: 3시간

**파일**: `src/services/canvas.service.aws.ts` (새 파일)

```typescript
import { generateClient } from 'aws-amplify/api';
import { 
  listCanvasObjects as listCanvasObjectsQuery,
  getCanvasObject as getCanvasObjectQuery 
} from './graphql/queries';
import { 
  createCanvasObject as createCanvasObjectMutation,
  updateCanvasObject as updateCanvasObjectMutation,
  deleteCanvasObject as deleteCanvasObjectMutation 
} from './graphql/mutations';
import { 
  onCanvasObjectCreated,
  onCanvasObjectUpdated,
  onCanvasObjectDeleted 
} from './graphql/subscriptions';
import type { CanvasObject } from '../types/canvas.types';

const client = generateClient();

// Create
export async function createShape(shape: Omit<CanvasObject, 'objectId' | 'createdAt' | 'updatedAt'>) {
  try {
    const response = await client.graphql({
      query: createCanvasObjectMutation,
      variables: {
        input: {
          canvasId: 'default', // 또는 동적으로
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          radius: shape.radius,
          color: shape.color,
          text: shape.text,
          fontSize: shape.fontSize,
          rotation: shape.rotation || 0,
          zIndex: shape.zIndex || 0,
          createdBy: shape.createdBy
        }
      }
    });
    return response.data.createCanvasObject;
  } catch (error) {
    console.error('Error creating shape:', error);
    throw error;
  }
}

// Read
export async function getShapes(canvasId: string = 'default'): Promise<CanvasObject[]> {
  try {
    const response = await client.graphql({
      query: listCanvasObjectsQuery,
      variables: { canvasId }
    });
    return response.data.listCanvasObjects;
  } catch (error) {
    console.error('Error fetching shapes:', error);
    throw error;
  }
}

// Update
export async function updateShape(
  objectId: string, 
  updates: Partial<CanvasObject>
) {
  try {
    const response = await client.graphql({
      query: updateCanvasObjectMutation,
      variables: {
        input: {
          canvasId: 'default',
          objectId,
          ...updates
        }
      }
    });
    return response.data.updateCanvasObject;
  } catch (error) {
    console.error('Error updating shape:', error);
    throw error;
  }
}

// Delete
export async function deleteShape(objectId: string) {
  try {
    const response = await client.graphql({
      query: deleteCanvasObjectMutation,
      variables: {
        canvasId: 'default',
        objectId
      }
    });
    return response.data.deleteCanvasObject;
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw error;
  }
}

// Subscribe to real-time updates
export function subscribeToCanvasUpdates(
  canvasId: string,
  callbacks: {
    onCreated: (shape: CanvasObject) => void;
    onUpdated: (shape: Partial<CanvasObject>) => void;
    onDeleted: (objectId: string) => void;
  }
) {
  // Subscribe to created
  const createSub = client.graphql({
    query: onCanvasObjectCreated,
    variables: { canvasId }
  }).subscribe({
    next: ({ data }) => callbacks.onCreated(data.onCanvasObjectCreated),
    error: (error) => console.error('Subscription error:', error)
  });

  // Subscribe to updated
  const updateSub = client.graphql({
    query: onCanvasObjectUpdated,
    variables: { canvasId }
  }).subscribe({
    next: ({ data }) => callbacks.onUpdated(data.onCanvasObjectUpdated),
    error: (error) => console.error('Subscription error:', error)
  });

  // Subscribe to deleted
  const deleteSub = client.graphql({
    query: onCanvasObjectDeleted,
    variables: { canvasId }
  }).subscribe({
    next: ({ data }) => callbacks.onDeleted(data.onCanvasObjectDeleted.objectId),
    error: (error) => console.error('Subscription error:', error)
  });

  // Return unsubscribe function
  return () => {
    createSub.unsubscribe();
    updateSub.unsubscribe();
    deleteSub.unsubscribe();
  };
}
```

**태스크**:
- [ ] 새로운 AWS 기반 canvas.service 작성
- [ ] CRUD 함수 구현 (AppSync GraphQL)
- [ ] Subscription 함수 구현
- [ ] 타입 정의 일치 확인

---

### Task 4.5: useCanvas Hook 수정
**시간**: 2시간

**파일**: `src/hooks/useCanvas.ts`

기존 Firestore 코드를 AWS 버전으로 교체:

```typescript
import { useEffect, useState } from 'react';
import { 
  getShapes, 
  createShape, 
  updateShape, 
  deleteShape,
  subscribeToCanvasUpdates 
} from '../services/canvas.service.aws';
import type { CanvasObject } from '../types/canvas.types';

export function useCanvas(canvasId: string = 'default') {
  const [shapes, setShapes] = useState<CanvasObject[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    async function loadShapes() {
      try {
        const data = await getShapes(canvasId);
        setShapes(data);
      } catch (error) {
        console.error('Error loading shapes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadShapes();
  }, [canvasId]);

  // 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToCanvasUpdates(canvasId, {
      onCreated: (shape) => {
        setShapes((prev) => [...prev, shape]);
      },
      onUpdated: (updates) => {
        setShapes((prev) =>
          prev.map((s) =>
            s.objectId === updates.objectId ? { ...s, ...updates } : s
          )
        );
      },
      onDeleted: (objectId) => {
        setShapes((prev) => prev.filter((s) => s.objectId !== objectId));
      }
    });

    return unsubscribe;
  }, [canvasId]);

  // CRUD 함수들
  const handleCreateShape = async (shape: Omit<CanvasObject, 'objectId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createShape(shape);
      // Subscription이 자동으로 상태 업데이트
    } catch (error) {
      console.error('Error creating shape:', error);
    }
  };

  const handleUpdateShape = async (objectId: string, updates: Partial<CanvasObject>) => {
    try {
      await updateShape(objectId, updates);
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  };

  const handleDeleteShape = async (objectId: string) => {
    try {
      await deleteShape(objectId);
    } catch (error) {
      console.error('Error deleting shape:', error);
    }
  };

  return {
    shapes,
    loading,
    createShape: handleCreateShape,
    updateShape: handleUpdateShape,
    deleteShape: handleDeleteShape
  };
}
```

**태스크**:
- [ ] useCanvas Hook 수정
- [ ] Firestore 코드 제거
- [ ] AppSync Subscriptions 통합
- [ ] 에러 핸들링 추가

---

### Task 4.6: AI Service REST API 통합
**시간**: 1시간

**파일**: `src/services/ai.service.aws.ts`

```typescript
import { post } from 'aws-amplify/api';
import { auth } from './firebase';

export async function executeAICommand(command: string, canvasId: string = 'default') {
  try {
    // Firebase Auth 토큰 가져오기
    const token = await auth.currentUser?.getIdToken();

    const response = await post({
      apiName: 'collabcanvas',
      path: '/ai/execute',
      options: {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          command,
          canvasId
        }
      }
    }).response;

    const data = await response.body.json();
    return data;
  } catch (error) {
    console.error('AI execution error:', error);
    throw error;
  }
}
```

**태스크**:
- [ ] AI Service AWS 버전 작성
- [ ] REST API 통합 (API Gateway)
- [ ] Firebase Auth 토큰 전송
- [ ] 기존 useAI Hook에 통합

---

### Task 4.7: App.tsx에 AWS 설정 추가
**시간**: 15분

**파일**: `src/App.tsx`

```typescript
import { useEffect } from 'react';
import './services/aws-config'; // Amplify 설정 임포트

function App() {
  useEffect(() => {
    console.log('AWS Amplify configured');
  }, []);

  return (
    // 기존 코드
  );
}
```

**태스크**:
- [ ] AWS 설정 임포트
- [ ] Firebase (Auth, Realtime DB) 유지
- [ ] 앱 초기화 확인

---

## Phase 5: 배포 및 테스트 (Day 10-11)

### Task 5.1: 백엔드 배포 (Serverless)
**시간**: 1시간

```bash
cd backend

# 환경 변수 설정
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
export FIREBASE_DATABASE_URL='https://xxx.firebaseio.com'
export OPENAI_API_KEY='sk-...'

# 배포
npx serverless deploy --stage dev
```

**배포 후 출력**:
```
endpoints:
  POST - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/dev/canvas/{canvasId}/objects
  GET - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/dev/canvas/{canvasId}/objects
  ...
  POST - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/dev/ai/execute
```

**태스크**:
- [ ] 환경 변수 설정
- [ ] Serverless 배포 실행
- [ ] API Gateway 엔드포인트 기록
- [ ] CloudWatch Logs 확인

---

### Task 5.2: 프론트엔드 환경 변수 업데이트
**시간**: 15분

**파일**: `.env.production`

```env
# Firebase (기존 유지)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...

# AWS (새로 추가)
VITE_AWS_APPSYNC_ENDPOINT=https://xxxxx.appsync-api.ap-northeast-2.amazonaws.com/graphql
VITE_AWS_APPSYNC_REGION=ap-northeast-2
VITE_AWS_APPSYNC_API_KEY=da2-xxxxxxxxxxxxxxxxx
VITE_AWS_API_GATEWAY_ENDPOINT=https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/dev

# OpenAI (백엔드에서 사용하므로 불필요)
```

**파일**: `src/services/aws-config.ts` 수정

```typescript
const awsConfig = {
  API: {
    aws_appsync_graphqlEndpoint: import.meta.env.VITE_AWS_APPSYNC_ENDPOINT,
    aws_appsync_region: import.meta.env.VITE_AWS_APPSYNC_REGION,
    aws_appsync_authenticationType: 'API_KEY',
    aws_appsync_apiKey: import.meta.env.VITE_AWS_APPSYNC_API_KEY
  },
  rest: {
    collabcanvas: {
      endpoint: import.meta.env.VITE_AWS_API_GATEWAY_ENDPOINT,
      region: 'ap-northeast-2'
    }
  }
};
```

**태스크**:
- [ ] 환경 변수 파일 생성
- [ ] API 엔드포인트 입력
- [ ] aws-config.ts 수정

---

### Task 5.3: Amplify Hosting 배포
**시간**: 1시간

#### 옵션 A: Amplify CLI

```bash
# Amplify에 Hosting 추가
amplify add hosting

? Select the plugin module to execute: Hosting with Amplify Console
? Choose a type: Manual deployment

# 빌드 및 배포
npm run build
amplify publish
```

#### 옵션 B: Amplify Console (추천)

1. AWS Amplify Console 이동
2. "New app" → "Host web app"
3. GitHub 연결
4. Repository 선택: `01_CollabCanvas`
5. Branch: `main`
6. Build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
7. Environment variables 추가 (모든 VITE_* 변수)
8. "Save and deploy"

**태스크**:
- [ ] Amplify Console에서 앱 생성
- [ ] GitHub 연결
- [ ] 빌드 설정 구성
- [ ] 환경 변수 입력
- [ ] 배포 실행
- [ ] 배포 URL 확인: `https://xxx.amplifyapp.com`

---

### Task 5.4: 통합 테스트
**시간**: 3시간

**테스트 시나리오**:

1. **인증 테스트**:
   - [ ] 회원가입 (Firebase Auth)
   - [ ] 로그인 (Firebase Auth)
   - [ ] 토큰이 API Gateway Authorizer 통과하는지 확인

2. **Canvas CRUD 테스트** (DynamoDB + AppSync):
   - [ ] 도형 생성 → DynamoDB 저장 확인
   - [ ] 도형 목록 조회 → 정상 반환 확인
   - [ ] 도형 이동 → 업데이트 확인
   - [ ] 도형 삭제 → 삭제 확인

3. **실시간 동기화 테스트** (AppSync Subscriptions):
   - [ ] 2개 브라우저 탭 열기
   - [ ] 탭 A에서 도형 생성 → 탭 B에 즉시 표시 확인
   - [ ] 탭 B에서 도형 이동 → 탭 A에 즉시 반영 확인
   - [ ] Latency 측정: <500ms 목표

4. **커서 & Presence 테스트** (Firebase Realtime DB):
   - [ ] 2개 브라우저 탭 열기
   - [ ] 커서 이동 → 다른 탭에 표시 확인
   - [ ] Presence 표시 확인 (온라인 사용자 목록)

5. **AI 명령 테스트** (Lambda + OpenAI):
   - [ ] "Create a red circle" → 도형 생성 확인
   - [ ] "Create a login form" → 복잡한 레이아웃 생성 확인
   - [ ] 응답 시간: <2초 확인
   - [ ] AI 생성 객체가 DynamoDB에 저장되는지 확인

6. **Comments 테스트** (DynamoDB):
   - [ ] 코멘트 추가
   - [ ] 코멘트 목록 조회
   - [ ] 코멘트 실시간 동기화

**도구**:
- Chrome DevTools Network 탭
- AWS CloudWatch Logs
- DynamoDB Console (데이터 확인)
- Firebase Console (Auth, Realtime DB 확인)

**태스크**:
- [ ] 모든 시나리오 테스트
- [ ] 버그 발견 시 수정
- [ ] 성능 측정 및 기록

---

### Task 5.5: 모니터링 설정
**시간**: 1시간

**CloudWatch Alarms**:

```bash
# Lambda 에러율 알람
aws cloudwatch put-metric-alarm \
  --alarm-name canvas-lambda-errors \
  --alarm-description "Lambda error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# DynamoDB 읽기 용량 알람
aws cloudwatch put-metric-alarm \
  --alarm-name dynamodb-read-throttle \
  --metric-name ReadThrottleEvents \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

**태스크**:
- [ ] Lambda 에러 알람 설정
- [ ] DynamoDB 쓰로틀 알람 설정
- [ ] API Gateway 5xx 에러 알람
- [ ] CloudWatch 대시보드 생성 (선택사항)

---

## Phase 6: 문서화 (Day 12)

### Task 6.1: 아키텍처 다이어그램 업데이트
**시간**: 1시간

**파일**: `AWS_ARCHITECTURE.md`

하이브리드 아키텍처 다이어그램 작성:
- Firebase Auth
- Firebase Realtime DB
- AWS DynamoDB
- AWS Lambda
- AWS AppSync
- AWS Amplify Hosting

**태스크**:
- [ ] Mermaid 다이어그램 작성
- [ ] 데이터 흐름 설명
- [ ] 각 서비스 역할 문서화

---

### Task 6.2: API 문서 작성
**시간**: 2시간

**파일**: `AWS_API_DOCUMENTATION.md`

**내용**:
1. **REST API Endpoints** (API Gateway):
   - POST `/canvas/{canvasId}/objects` - 도형 생성
   - GET `/canvas/{canvasId}/objects` - 도형 목록
   - PUT `/canvas/{canvasId}/objects/{objectId}` - 도형 업데이트
   - DELETE `/canvas/{canvasId}/objects/{objectId}` - 도형 삭제
   - POST `/ai/execute` - AI 명령 실행

2. **GraphQL API** (AppSync):
   - Queries: getCanvasObject, listCanvasObjects
   - Mutations: createCanvasObject, updateCanvasObject, deleteCanvasObject
   - Subscriptions: onCanvasObjectCreated, onCanvasObjectUpdated, onCanvasObjectDeleted

3. **Authentication**:
   - Firebase ID Token in Authorization header
   - `Authorization: Bearer <token>`

**태스크**:
- [ ] API 문서 작성
- [ ] 요청/응답 예제
- [ ] 에러 코드 설명

---

### Task 6.3: README 업데이트
**시간**: 1시간

**파일**: `README.md`

**추가 섹션**:
```markdown
## Architecture

This project uses a hybrid architecture:

- **Frontend**: React + TypeScript + Konva.js
- **Authentication**: Firebase Authentication
- **Real-time Cursors**: Firebase Realtime Database
- **Data Storage**: AWS DynamoDB
- **Backend API**: AWS Lambda + API Gateway
- **Real-time Sync**: AWS AppSync GraphQL Subscriptions
- **Hosting**: AWS Amplify Hosting
- **AI**: OpenAI GPT-4 via Lambda

## Setup

### Prerequisites
- AWS Account
- Firebase Project
- Node.js 20+

### Environment Variables

Create `.env.local`:
```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...

# AWS
VITE_AWS_APPSYNC_ENDPOINT=...
VITE_AWS_APPSYNC_API_KEY=...
VITE_AWS_API_GATEWAY_ENDPOINT=...
```

### Backend Deployment

```bash
cd backend
npm install
export FIREBASE_SERVICE_ACCOUNT_KEY='...'
export OPENAI_API_KEY='...'
npx serverless deploy
```

### Frontend Deployment

```bash
npm install
npm run build
amplify publish
```
```

**태스크**:
- [ ] README 아키텍처 섹션 추가
- [ ] 설치 가이드 업데이트
- [ ] 배포 가이드 추가

---

## Phase 7: 최적화 및 비용 절감 (선택사항)

### Task 7.1: DynamoDB On-Demand → Provisioned
**조건**: 트래픽 예측 가능할 때

- [ ] 평균 RCU/WCU 측정
- [ ] Provisioned Capacity로 전환
- [ ] Auto Scaling 설정
- [ ] 비용 절감: 약 30-50%

### Task 7.2: Lambda 최적화
- [ ] 메모리 크기 튜닝 (128MB → 256MB 테스트)
- [ ] Cold Start 최소화 (Provisioned Concurrency)
- [ ] Code bundling (esbuild, webpack)

### Task 7.3: AppSync 캐싱
- [ ] AppSync Caching 활성화 (TTL 60초)
- [ ] Query 결과 캐싱으로 비용 절감

---

## 타임라인 요약

| Day | Phase | 주요 작업 | 시간 |
|-----|-------|----------|------|
| 1-2 | Phase 1 | AWS 계정, DynamoDB, Amplify 초기화 | 4-5h |
| 3-5 | Phase 2 | Lambda 함수 개발, Serverless 설정 | 12-15h |
| 6 | Phase 3 | AppSync GraphQL API 설정 | 4-5h |
| 7-9 | Phase 4 | 프론트엔드 통합, Service/Hook 수정 | 8-10h |
| 10-11 | Phase 5 | 배포, 테스트, 모니터링 | 6-8h |
| 12 | Phase 6 | 문서화 | 4-5h |

**총 예상 시간**: 38-48시간 (약 5-7일, 하루 8시간 기준)

---

## 위험 요소 및 대응

### 위험 1: AppSync Subscriptions 지연
**증상**: 실시간 업데이트가 Firebase보다 느림 (100-300ms)
**대응**: 
- Firebase Realtime DB로 폴백
- WebSocket + Lambda로 직접 구현

### 위험 2: Lambda Cold Start
**증상**: 첫 요청 시 1-2초 지연
**대응**:
- Provisioned Concurrency (비용 증가)
- Lambda warming (cron으로 주기적 호출)

### 위험 3: DynamoDB 비용 급증
**증상**: 예상보다 높은 월 비용
**대응**:
- On-Demand → Provisioned 전환
- TTL 설정으로 불필요한 데이터 자동 삭제
- 쿼리 최적화 (GSI 활용)

### 위험 4: API Gateway Rate Limit
**증상**: 429 Too Many Requests
**대응**:
- Usage Plan 설정 (사용자별 제한)
- Burst limit 증가 요청

---

## 비용 예상 (월간)

### 프리 티어 기간 (12개월)
- Lambda: 무료 (100만 요청)
- DynamoDB: 무료 (25GB, 25 RCU/WCU)
- API Gateway: 무료 (100만 요청)
- AppSync: 무료 (25만 쿼리/변경)
- **총 비용: $0-5/월** (초과분만)

### 프리 티어 이후 (중소 규모)
- Lambda: $3
- DynamoDB: $17.50
- AppSync: $14
- API Gateway: $3.50
- Amplify Hosting: $15
- **총 비용: $53/월**

### Firebase 비용 (비교)
- Firebase (Blaze): $35-90/월

**결론**: AWS는 초기에는 저렴하지만, 트래픽 증가 시 비용 관리 필요

---

## 체크리스트

### Phase 1: 인프라
- [ ] AWS 계정 생성
- [ ] DynamoDB 테이블 2개 생성
- [ ] Amplify CLI 초기화

### Phase 2: 백엔드
- [ ] Lambda 함수 10개 작성
- [ ] DynamoDB 헬퍼 라이브러리
- [ ] Firebase Admin 통합
- [ ] Serverless 설정

### Phase 3: AppSync
- [ ] AppSync API 생성
- [ ] GraphQL 스키마 정의
- [ ] Resolvers 6개 생성

### Phase 4: 프론트엔드
- [ ] Amplify SDK 설치
- [ ] GraphQL 쿼리/뮤테이션 정의
- [ ] canvas.service.aws.ts 작성
- [ ] useCanvas Hook 수정
- [ ] AI Service REST 통합

### Phase 5: 배포
- [ ] 백엔드 배포 (Serverless)
- [ ] 프론트엔드 배포 (Amplify)
- [ ] 통합 테스트 (6개 시나리오)
- [ ] 모니터링 설정

### Phase 6: 문서화
- [ ] 아키텍처 다이어그램
- [ ] API 문서
- [ ] README 업데이트

---

## 다음 단계

1. **승인 대기**: 이 계획을 검토하고 승인해 주세요
2. **환경 준비**: AWS 계정, Firebase 서비스 계정 키 준비
3. **코딩 시작**: Phase 1부터 순차적으로 진행
4. **진행 상황 보고**: 각 Phase 완료 후 체크인

**질문 사항**:
- AWS 계정이 이미 있나요?
- Firebase 서비스 계정 키를 생성하셨나요?
- OpenAI API 키가 있나요?
- 타임라인: 언제까지 완료해야 하나요?

이 계획으로 진행하시겠습니까? 승인되면 코딩을 시작하겠습니다.

