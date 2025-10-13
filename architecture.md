graph TB
    subgraph ClientApp["Client Application - Browser"]
        subgraph ReactApp["React Application"]
            App[App.tsx<br/>Main App Component]
            
            subgraph AuthComp["Auth Components"]
                Login[Login.tsx]
                Signup[Signup.tsx]
                AuthGuard[AuthGuard.tsx]
            end
            
            subgraph CanvasComp["Canvas Components"]
                Canvas[Canvas.tsx<br/>Konva Stage<br/>LOADS from Firestore on mount]
                Toolbar[CanvasToolbar.tsx]
                Shape[Shape.tsx<br/>Rect/Circle/Text<br/>WRITES to Firestore on<br/>create/move/resize]
                Cursors[MultiplayerCursors.tsx]
            end
            
            subgraph PresenceComp["Presence Components"]
                Sidebar[PresenceSidebar.tsx]
                Avatar[UserAvatar.tsx]
            end
            
            subgraph Hooks["Custom Hooks"]
                useAuth[useAuth.ts]
                useCanvas[useCanvas.ts<br/>Manages shared canvas state]
                useCursors[useCursors.ts]
                usePresence[usePresence.ts]
            end
            
            subgraph Services["Services Layer"]
                AuthService[auth.service.ts<br/>signup/login/logout]
                CanvasService[canvas.service.ts<br/>CRUD and Persistence<br/>Saves ALL changes<br/>create/move/resize]
                CursorService[cursor.service.ts<br/>cursor updates]
                PresenceService[presence.service.ts<br/>online/offline]
                FirebaseConfig[firebase.ts<br/>SDK initialization]
            end
            
            subgraph TypesUtils["Types and Utils"]
                Types[TypeScript Types<br/>canvas/user/presence]
                Utils[Utilities<br/>colors/validation]
            end
        end
    end
    
    subgraph FirebaseBackend["Firebase Backend - PERSISTENT STORAGE"]
        subgraph FirebaseServices["Firebase Services"]
            FirebaseAuth[Firebase Authentication<br/>Email/Password]
            
            subgraph FirestoreDB["Firestore Database - SINGLE SHARED CANVAS"]
                CanvasCollection[(canvasObjects Collection<br/>STORES ALL USERS WORK<br/>PERSISTS INDEFINITELY)]
                ObjectDoc["Document Schema:<br/>id, type, x, y, width,<br/>height, color, radius,<br/>text, fontSize, createdBy,<br/>createdAt, lastModifiedBy,<br/>lastModifiedAt, lockedBy,<br/>lockedAt<br/><br/>EVERY shape from EVERY user<br/>stored here permanently"]
            end
            
            subgraph RealtimeDB["Realtime Database - EPHEMERAL DATA"]
                CursorPath[(cursorPositions/userId<br/>temporary, not persisted)]
                CursorData["Cursor Data:<br/>x, y, name, color"]
                PresencePath[(presence/userId<br/>temporary, not persisted)]
                PresenceData["Presence Data:<br/>online, lastSeen"]
            end
            
            FirebaseHosting[Firebase Hosting<br/>Static Site Serving]
        end
    end
    
    subgraph Testing["Testing Infrastructure"]
        Vitest[Vitest Test Runner]
        TestUtils[Test Utilities<br/>Mocks and Helpers]
        UnitTests[Unit Tests<br/>Services/Hooks/Components]
        IntegrationTests[Integration Tests<br/>Complete Workflows<br/>Shared Canvas Tests]
    end
    
    subgraph UserFlow["User Experience Flow"]
        UserA[User A creates and resizes shapes]
        UserALeaves[User A logs out]
        UserBJoins[User B logs in]
        UserBSeesA[User B sees User A work<br/>with correct sizes]
        UserBAdds[User B adds and resizes shapes]
        UserBLeaves[User B logs out]
        UserAReturns[User A returns later]
        UserASeesAll[User A sees ALL work<br/>from both users<br/>all positions and sizes intact]
    end
    
    %% Component to Hook connections
    Login --> useAuth
    Signup --> useAuth
    AuthGuard --> useAuth
    Canvas --> useCanvas
    Canvas --> useCursors
    Canvas --> usePresence
    Sidebar --> usePresence
    Cursors --> useCursors
    
    %% Hook to Service connections
    useAuth --> AuthService
    useCanvas --> CanvasService
    useCursors --> CursorService
    usePresence --> PresenceService
    
    %% Service to Firebase connections
    AuthService --> FirebaseConfig
    CanvasService --> FirebaseConfig
    CursorService --> FirebaseConfig
    PresenceService --> FirebaseConfig
    
    FirebaseConfig --> FirebaseAuth
    FirebaseConfig --> CanvasCollection
    FirebaseConfig --> CursorPath
    FirebaseConfig --> PresencePath
    
    %% Data structure relationships
    CanvasCollection --> ObjectDoc
    CursorPath --> CursorData
    PresencePath --> PresenceData
    
    %% Real-time sync AND persistence connections
    CanvasCollection ==>|WRITES on every<br/>create/move/resize| CanvasService
    CanvasService ==>|READS all shapes on load| CanvasCollection
    CanvasCollection -.->|onSnapshot listener<br/>real-time updates| CanvasService
    CursorPath -.->|onValue listener| CursorService
    PresencePath -.->|onValue listener| PresenceService
    
    %% Canvas rendering connections
    Canvas --> Shape
    Canvas --> Cursors
    Canvas --> Toolbar
    useCanvas -.->|state management| Canvas
    
    %% Types and Utils
    Types -.->|type definitions| Services
    Types -.->|type definitions| Hooks
    Utils -.->|helper functions| CanvasComp
    
    %% Testing connections
    Vitest --> UnitTests
    Vitest --> IntegrationTests
    TestUtils --> UnitTests
    TestUtils --> IntegrationTests
    UnitTests -.->|tests| Services
    UnitTests -.->|tests| Hooks
    UnitTests -.->|tests| CanvasComp
    IntegrationTests -.->|tests| App
    
    %% User Flow connections
    UserA --> UserALeaves
    UserALeaves --> UserBJoins
    UserBJoins --> UserBSeesA
    UserBSeesA --> UserBAdds
    UserBAdds --> UserBLeaves
    UserBLeaves --> UserAReturns
    UserAReturns --> UserASeesAll
    
    %% User Flow to System
    UserA -.->|creates shapes| Canvas
    UserBJoins -.->|loads from| CanvasCollection
    UserAReturns -.->|loads from| CanvasCollection
    
    %% Deployment
    App ==>|build and deploy| FirebaseHosting
    FirebaseHosting ==>|serves static files| ClientApp
    
    %% Styling
    classDef component fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef service fill:#ffa500,stroke:#333,stroke-width:2px,color:#000
    classDef firebase fill:#ffca28,stroke:#333,stroke-width:2px,color:#000
    classDef database fill:#4caf50,stroke:#333,stroke-width:2px,color:#000
    classDef testing fill:#9c27b0,stroke:#333,stroke-width:2px,color:#fff
    classDef userflow fill:#e91e63,stroke:#333,stroke-width:2px,color:#fff
    
    class Login,Signup,AuthGuard,Canvas,Toolbar,Shape,Cursors,Sidebar,Avatar component
    class useAuth,useCanvas,useCursors,usePresence,AuthService,CanvasService,CursorService,PresenceService service
    class FirebaseAuth,FirebaseHosting,FirebaseConfig firebase
    class CanvasCollection,ObjectDoc,CursorPath,CursorData,PresencePath,PresenceData database
    class Vitest,TestUtils,UnitTests,IntegrationTests testing
    class UserA,UserALeaves,UserBJoins,UserBSeesA,UserBAdds,UserBLeaves,UserAReturns,UserASeesAll userflow