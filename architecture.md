graph TB
    subgraph Client["Client Application - React + TypeScript"]
        subgraph UI["User Interface Layer"]
            Canvas[Canvas Component<br/>Konva.js Stage]
            Toolbar[Toolbar<br/>Tools + Actions]
            AIPanel[AI Panel<br/>Command Input]
            Comments[Comment Pins<br/>Collaborative Annotations]
            Presence[Presence Sidebar<br/>Online Users]
        end
        
        subgraph Components["Component Layer"]
            Shape[Shape Components<br/>Rectangle/Circle/Text]
            SelectionBox[Selection Box<br/>Multi-Select]
            Cursors[Multiplayer Cursors]
            CommentThread[Comment Threads]
            ContextMenu[Context Menu<br/>Z-index + Actions]
        end
        
        subgraph Hooks["Custom Hooks Layer"]
            useCanvas[useCanvas<br/>Canvas State Management]
            useAI[useAI<br/>AI Command State]
            useComments[useComments<br/>Comment State]
            useAuth[useAuth<br/>Authentication]
            usePresence[usePresence<br/>Presence Tracking]
            useCursors[useCursors<br/>Cursor Sync]
            useHistory[useHistory<br/>Undo/Redo Stack]
            useKeyboard[useKeyboardShortcuts<br/>Shortcut Handler]
        end
        
        subgraph Services["Service Layer"]
            CanvasService[Canvas Service<br/>CRUD + Persistence<br/>create/move/resize]
            AIService[AI Service<br/>OpenAI/Claude API]
            AIExecutor[AI Tool Executor<br/>Function Calling]
            CommentService[Comment Service<br/>CRUD Comments]
            AuthService[Auth Service<br/>Firebase Auth]
            CursorService[Cursor Service<br/>Real-time Cursors]
            PresenceService[Presence Service<br/>Online/Offline]
        end
        
        subgraph Utils["Utility Functions"]
            LayoutUtils[Layout Utils<br/>arrange/align/distribute]
            ZIndexUtils[Z-Index Utils<br/>bring forward/back]
            AlignmentUtils[Alignment Utils<br/>align/distribute]
            AIToolsSchema[AI Tools Schema<br/>Function Definitions]
        end
        
        subgraph State["State Management"]
            HistoryStore[History Store<br/>Action Stack for Undo/Redo]
            ClipboardState[Clipboard State<br/>Copy/Paste]
        end
    end
    
    subgraph AI["AI Provider"]
        OpenAI[OpenAI GPT-4<br/>Function Calling]
        Claude[Anthropic Claude 3.5<br/>Tool Use]
    end
    
    subgraph Firebase["Firebase Backend"]
        subgraph Auth["Firebase Authentication"]
            FirebaseAuth[Email/Password Auth<br/>User Management]
        end
        
        subgraph Firestore["Firestore Database"]
            CanvasObjects[(canvasObjects<br/>id, type, x, y, width,<br/>height, color, zIndex,<br/>createdBy, lockedBy)]
            CommentsCollection[(comments<br/>id, text, author,<br/>x, y, resolved,<br/>replies, createdAt)]
        end
        
        subgraph RealtimeDB["Realtime Database"]
            Cursors[(cursorPositions/userId<br/>x, y, name, color)]
            Presence[(presence/userId<br/>online, lastSeen)]
        end
        
        Hosting[Firebase Hosting<br/>Static Site Deployment]
    end
    
    subgraph Features["Feature Highlights"]
        MVPFeatures[MVP Features<br/>✓ Real-time sync<br/>✓ Object locking<br/>✓ Persistence<br/>✓ Multi-select]
        
        AIFeatures[AI Features NEW<br/>✓ 8+ command types<br/>✓ Complex commands<br/>✓ Layout automation<br/>✓ Sub-2s response]
        
        AdvancedFeatures[Advanced Features NEW<br/>✓ Undo/Redo<br/>✓ Keyboard shortcuts<br/>✓ Copy/Paste<br/>✓ Z-index management<br/>✓ Alignment tools<br/>✓ Comments]
        
        BonusFeatures[Bonus Features NEW<br/>✓ AI suggestions<br/>✓ Smooth animations<br/>✓ 1000+ objects<br/>✓ 10+ users]
    end
    
    %% UI to Component connections
    Canvas --> Shape
    Canvas --> SelectionBox
    Canvas --> Cursors
    Canvas --> Comments
    AIPanel --> CommentThread
    
    %% Component to Hook connections
    Canvas --> useCanvas
    Canvas --> useCursors
    Canvas --> usePresence
    Canvas --> useKeyboard
    AIPanel --> useAI
    Comments --> useComments
    Toolbar --> useCanvas
    Toolbar --> useHistory
    
    %% Hook to Service connections
    useCanvas --> CanvasService
    useAI --> AIService
    useAI --> AIExecutor
    useComments --> CommentService
    useAuth --> AuthService
    useCursors --> CursorService
    usePresence --> PresenceService
    
    %% Service to AI connections
    AIService --> OpenAI
    AIService --> Claude
    AIExecutor --> CanvasService
    AIExecutor --> LayoutUtils
    AIExecutor --> AIToolsSchema
    
    %% Service to Firebase connections
    CanvasService --> CanvasObjects
    CommentService --> CommentsCollection
    CursorService --> Cursors
    PresenceService --> Presence
    AuthService --> FirebaseAuth
    
    %% Util connections
    useCanvas --> LayoutUtils
    useCanvas --> ZIndexUtils
    useCanvas --> AlignmentUtils
    useHistory --> HistoryStore
    useKeyboard --> ClipboardState
    
    %% Real-time sync connections
    CanvasObjects -.->|onSnapshot<br/>real-time updates| CanvasService
    CommentsCollection -.->|onSnapshot<br/>real-time updates| CommentService
    Cursors -.->|onValue<br/>real-time updates| CursorService
    Presence -.->|onValue<br/>real-time updates| PresenceService
    
    %% Write operations
    CanvasService ==>|WRITES<br/>create/move/resize| CanvasObjects
    CommentService ==>|WRITES<br/>add/reply/resolve| CommentsCollection
    CursorService ==>|WRITES<br/>position updates| Cursors
    PresenceService ==>|WRITES<br/>online/offline| Presence
    
    %% AI flow
    AIPanel -->|User Command| AIService
    AIService -->|Parse Intent| OpenAI
    OpenAI -->|Function Calls| AIExecutor
    AIExecutor -->|Execute Actions| CanvasService
    CanvasService -->|Create Shapes| Canvas
    
    %% Feature connections
    MVPFeatures -.->|builds on| AIFeatures
    AIFeatures -.->|enhanced by| AdvancedFeatures
    AdvancedFeatures -.->|polished with| BonusFeatures
    
    %% Deployment
    Client ==>|npm run build| Hosting
    Hosting ==>|serves| Client
    
    %% Styling
    classDef uiLayer fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef serviceLayer fill:#ffa500,stroke:#333,stroke-width:2px,color:#000
    classDef firebaseLayer fill:#ffca28,stroke:#333,stroke-width:2px,color:#000
    classDef aiLayer fill:#10a37f,stroke:#333,stroke-width:2px,color:#fff
    classDef featureLayer fill:#e91e63,stroke:#333,stroke-width:2px,color:#fff
    classDef stateLayer fill:#9c27b0,stroke:#333,stroke-width:2px,color:#fff
    
    class Canvas,Toolbar,AIPanel,Comments,Presence,Shape,SelectionBox,Cursors,CommentThread,ContextMenu uiLayer
    class CanvasService,AIService,AIExecutor,CommentService,AuthService,CursorService,PresenceService serviceLayer
    class FirebaseAuth,CanvasObjects,CommentsCollection,Cursors,Presence,Hosting firebaseLayer
    class OpenAI,Claude aiLayer
    class MVPFeatures,AIFeatures,AdvancedFeatures,BonusFeatures featureLayer
    class HistoryStore,ClipboardState stateLayer