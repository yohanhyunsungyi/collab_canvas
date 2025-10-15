# CollabCanvas - Final Project PRD

## Executive Summary

Building on the completed MVP, this PRD outlines the path to a **90-100 point final submission** by implementing the AI Canvas Agent and strategic advanced features from the rubric.

**Project Timeline:** 7 days (MVP complete, 7 days remaining)

**Target Score Breakdown:**
- Section 1: Core Collaborative Infrastructure (30 pts) - **COMPLETE from MVP**
- Section 2: Canvas Features & Performance (20 pts) - **18-20 pts from MVP + improvements**
- Section 3: Advanced Figma Features (15 pts) - **NEW - Target 13-15 pts**
- Section 4: AI Canvas Agent (25 pts) - **NEW - Target 23-25 pts**
- Section 5: Technical Implementation (10 pts) - **8-10 pts from MVP + improvements**
- Section 6: Documentation & Submission (5 pts) - **NEW - Target 5 pts**
- Section 7: AI Development Log (Pass/Fail) - **NEW - MUST PASS**
- Section 8: Demo Video (Pass/Fail) - **NEW - MUST PASS**
- Bonus Points (up to +5) - **Target +3-5 pts**

**Total Target: 95-100 points (A grade)**

---

## What's Already Complete (From MVP)

### ✅ Section 1: Core Collaborative Infrastructure (30 pts)
- Real-time sync (<100ms objects, <50ms cursors)
- Object locking for conflict resolution
- Full persistence with Firestore
- Graceful reconnection handling
- **Expected Score: 28-30 pts**

### ✅ Section 2: Canvas Features (Partial - 20 pts)
From MVP:
- Pan/zoom
- 3 shape types (rectangle, circle, text)
- Move and resize transforms
- Single selection
- Delete functionality
- 500+ objects at 60 FPS
- 5+ concurrent users

**Current Expected Score: 14-16 pts**

Need to add for full points:
- Multi-select (shift-click or drag-to-select)
- Layer management (bring to front/send to back)
- Duplicate functionality
- Text formatting options

---

## Final Project Priorities

### Priority 1: AI Canvas Agent (25 pts) - CRITICAL
**Target: 23-25 points**

Must demonstrate:
- 8+ distinct command types across all categories
- Complex command execution (login forms, layouts)
- Sub-2 second response time
- 90%+ accuracy
- Multi-user AI with shared state
- Natural UX with feedback

### Priority 2: Advanced Figma Features (15 pts)
**Target: 13-15 points (Excellent tier)**

Strategic selection for maximum points with minimum effort:

**Tier 1 Features (Choose 3 × 2pts = 6pts):**
1. **Undo/Redo** - High value, expected feature
2. **Keyboard shortcuts** - Quick to implement, big UX win
3. **Copy/Paste** - Essential collaboration feature

**Tier 2 Features (Choose 2 × 3pts = 6pts):**
1. **Z-index management** - Extends MVP layer management
2. **Alignment tools** - High utility, demonstrates polish

**Tier 3 Feature (Choose 1 × 3pts = 3pts):**
1. **Collaborative comments/annotations** - Differentiator, leverages real-time infrastructure

**Total: 15 points**

### Priority 3: Documentation & Demo (5 pts + Pass/Fail)
**Target: 5 points + PASS on both requirements**

Required deliverables:
- Comprehensive README with setup guide
- Architecture documentation
- AI Development Log (Pass/Fail)
- 3-5 minute demo video (Pass/Fail)
- Stable deployment

### Priority 4: Polish for Bonus Points (+5 pts)
**Target: +3-5 bonus points**

Focus areas:
- **Innovation (+2)**: AI-powered design suggestions
- **Polish (+2)**: Exceptional UX with animations
- **Scale (+1)**: Demonstrate 1000+ objects, 10+ users

---

## AI Canvas Agent - Detailed Requirements

### Command Architecture

**Minimum Required: 8+ distinct commands across 4 categories**

#### Creation Commands (Target: 3 commands)
1. **Simple Shape Creation**
   - "Create a red circle at position 100, 200"
   - "Make a 200x300 blue rectangle"
   - "Add a text layer that says 'CollabCanvas'"

2. **Styled Shape Creation**
   - "Create a green circle with 50px radius"
   - "Make a yellow rectangle at the center"

3. **Multiple Shapes**
   - "Create 5 circles in a row"
   - "Add 3 rectangles"

#### Manipulation Commands (Target: 3 commands)
1. **Move Operations**
   - "Move the blue rectangle to the center"
   - "Move the text to position 200, 300"
   - "Shift all circles 50px to the right"

2. **Resize Operations**
   - "Make the circle twice as big"
   - "Resize the rectangle to 300x400"
   - "Scale the text by 150%"

3. **Delete Operations**
   - "Delete the red circle"
   - "Remove all rectangles"
   - "Clear the canvas"

#### Layout Commands (Target: 3 commands)
1. **Arrangement**
   - "Arrange these shapes in a horizontal row"
   - "Stack these elements vertically"
   - "Create a grid of 3x3 squares"

2. **Spacing**
   - "Space these elements evenly"
   - "Add 20px padding between all shapes"
   - "Center all selected objects"

3. **Alignment**
   - "Align all shapes to the left"
   - "Center these circles horizontally"
   - "Distribute shapes evenly across the canvas"

#### Complex Commands (Target: 4+ commands) - CRITICAL FOR HIGH SCORE
1. **Login Form** ⭐
   - "Create a login form"
   - Expected: Username input, password input, submit button, proper spacing
   - Minimum 3 elements, well-arranged

2. **Navigation Bar** ⭐
   - "Build a navigation bar with 4 menu items"
   - Expected: 4+ text elements, background rectangle, proper spacing

3. **Card Layout** ⭐
   - "Make a card layout"
   - Expected: Title text, placeholder for image, description text, proper hierarchy

4. **Dashboard Layout**
   - "Create a dashboard with 4 cards"
   - Expected: 4 card components, grid layout, labels

5. **Contact Form**
   - "Build a contact form with name, email, and message fields"
   - Expected: 3+ input fields, labels, submit button

### AI Technical Implementation

**Function Calling Schema:**
```typescript
interface CanvasAITools {
  createShape(type: 'rectangle' | 'circle' | 'text', options: {
    x?: number, y?: number, width?: number, height?: number,
    radius?: number, color?: string, text?: string, fontSize?: number
  }): string; // returns shapeId
  
  updateShape(shapeId: string, options: {
    x?: number, y?: number, width?: number, height?: number,
    color?: string, text?: string
  }): void;
  
  deleteShape(shapeId: string): void;
  
  getCanvasState(): CanvasObject[];
  
  findShapesByProperty(property: string, value: any): CanvasObject[];
  
  // Layout helpers
  arrangeHorizontal(shapeIds: string[], spacing?: number): void;
  arrangeVertical(shapeIds: string[], spacing?: number): void;
  arrangeGrid(shapeIds: string[], columns: number, spacing?: number): void;
  centerShape(shapeId: string): void;
  
  // Batch operations
  createMultipleShapes(shapes: ShapeDefinition[]): string[];
}
```

**AI Model Selection:**
- Primary: OpenAI GPT-4 (or GPT-4-turbo) with function calling
- Alternative: Anthropic Claude 3.5 Sonnet (current model) with tool use
- Backup: GPT-3.5-turbo for cost efficiency

**Performance Requirements:**
- Response time: <2 seconds (excellent tier)
- Accuracy: 90%+ (parse intent correctly)
- Concurrent users: Multiple users can use AI simultaneously
- Shared state: All users see AI-generated results

**UX Requirements:**
- AI input panel (text input + send button)
- Loading indicator during AI processing
- Success/error feedback messages
- Visual indication of AI-generated objects (optional: highlight or animation)
- Command history (show recent commands)

---

## Advanced Features - Implementation Strategy

### Tier 1 Features

#### 1. Undo/Redo (2 pts)
**Why:** Essential feature, expected by users, leverages existing state management

**Implementation:**
- Maintain action history stack
- Store state snapshots for each action
- Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)
- Actions to track: create, delete, move, resize, color change
- Max history: 50 actions

**User Stories:**
- As a user, I want to undo my last action so I can fix mistakes
- As a user, I want to redo an action I undid so I can restore changes

#### 2. Keyboard Shortcuts (2 pts)
**Why:** Quick win, significantly improves UX

**Shortcuts to Implement:**
- `Delete` / `Backspace` - Delete selected object
- `Cmd/Ctrl + D` - Duplicate selected object
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + C` - Copy
- `Cmd/Ctrl + V` - Paste
- `Arrow keys` - Move selected object by 1px (hold Shift for 10px)
- `Escape` - Deselect all
- `Cmd/Ctrl + A` - Select all

**Implementation:**
- Global keyboard event listener
- Handle command key differences (Mac vs Windows)
- Prevent conflicts with browser shortcuts

#### 3. Copy/Paste (2 pts)
**Why:** Essential collaboration feature, builds on existing duplication

**Implementation:**
- Store copied object in clipboard state
- Paste creates new object at offset position
- Keyboard shortcuts: Cmd/Ctrl+C, Cmd/Ctrl+V
- Support pasting multiple times
- Visual feedback on copy/paste

### Tier 2 Features

#### 1. Z-index Management (3 pts)
**Why:** Natural extension of MVP, adds depth to canvas

**Features:**
- Bring to Front
- Send to Back
- Bring Forward (one layer)
- Send Backward (one layer)
- Right-click context menu
- Keyboard shortcuts

**Implementation:**
- Store z-index in Firestore for each shape
- Update Konva layer ordering
- Sync z-index changes across users

#### 2. Alignment Tools (3 pts)
**Why:** Professional feature, improves layout creation

**Tools to Implement:**
- Align Left
- Align Right  
- Align Top
- Align Bottom
- Align Center (horizontal)
- Align Middle (vertical)
- Distribute Horizontally
- Distribute Vertically

**Implementation:**
- Toolbar with alignment buttons
- Works on multiple selected objects
- Calculate bounding boxes for alignment
- Smooth animation of alignment

### Tier 3 Feature

#### Collaborative Comments/Annotations (3 pts)
**Why:** Unique differentiator, leverages real-time infrastructure, improves collaboration

**Features:**
- Add comment pins to canvas
- Comment threads
- @mention users
- Resolve/unresolve comments
- Real-time comment sync
- Comment notifications

**Implementation:**
- New Firestore collection: `comments`
- Comment component overlay on canvas
- Position comments at specific canvas coordinates
- User avatars next to comments
- Timestamp and author info

---

## Performance & Quality Targets

### Performance Requirements (Rubric Section 2)

**Current MVP Performance:**
- ✅ 500+ objects at 60 FPS
- ✅ 5+ concurrent users
- ✅ <100ms object sync
- ✅ <50ms cursor sync

**Final Performance Targets:**
- ✅ Maintain MVP performance with new features
- ⭐ Bonus: 1000+ objects at 60 FPS (+1 pt)
- ⭐ Bonus: 10+ concurrent users (+1 pt)

**Optimization Strategies:**
- Virtualize off-screen objects
- Throttle resize/move updates during drag
- Debounce AI requests
- Lazy load comment threads
- Use Konva caching for static objects

### Code Quality Requirements (Rubric Section 5)

**Architecture Quality (5 pts):**
- Clean separation of concerns
- Modular components
- Proper error handling
- TypeScript types throughout
- Consistent naming conventions
- Comments for complex logic

**Authentication & Security (5 pts):**
- From MVP: Secure Firebase Auth
- Add: Rate limiting for AI requests
- Add: Input sanitization for AI commands
- Add: User permissions for comments

---

## Documentation Requirements (Rubric Section 6)

### Repository & Setup (3 pts)

**README.md Structure:**
```markdown
# CollabCanvas

## Features
- Real-time collaborative canvas
- AI-powered design assistant
- Advanced editing tools

## Tech Stack
- Frontend: React + TypeScript + Konva.js
- Backend: Firebase (Firestore, Realtime DB, Auth)
- AI: OpenAI GPT-4 / Anthropic Claude

## Setup Instructions
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run locally: `npm run dev`
5. Run tests: `npm test`

## Environment Variables
[List all required variables]

## Project Structure
[Folder structure with descriptions]

## Architecture
[Link to architecture docs or diagram]

## Deployment
[Deployment instructions]

## Features Demo
[Link to demo video]
```

**ARCHITECTURE.md:**
- System architecture diagram
- Data flow diagrams
- Firestore schema
- Real-time sync strategy
- AI integration architecture
- Performance considerations

### Deployment (2 pts)

**Requirements:**
- Stable deployment on Firebase Hosting
- Publicly accessible URL
- Supports 5+ users (10+ for bonus)
- Fast load times (<3 seconds)
- No console errors
- HTTPS enabled

---

## AI Development Log (Pass/Fail - REQUIRED)

**Must include 3 out of 5 sections with meaningful reflection:**

### 1. Tools & Workflow
Document which AI tools were used and how:
- Code generation: Claude/Cursor/GitHub Copilot
- Debugging assistance
- Documentation writing
- Test generation
- Architecture decisions

### 2. Prompting Strategies (3-5 examples)
**Example effective prompts:**
1. "Create a React component for [feature] with TypeScript types, using Konva.js for canvas rendering"
2. "Debug this Firestore listener - it's not updating state when documents change"
3. "Write integration tests for the AI command parser using Vitest"
4. "Optimize this function for performance when handling 1000+ objects"
5. "Generate OpenAI function calling schema for canvas manipulation tools"

### 3. Code Analysis
Estimate breakdown:
- AI-generated: ~60-70%
- AI-assisted (edited by human): ~20-30%
- Hand-written: ~10%

### 4. Strengths & Limitations
**Where AI excelled:**
- Boilerplate code generation
- TypeScript type definitions
- Test case generation
- Documentation writing
- Bug identification

**Where AI struggled:**
- Complex state management logic
- Performance optimization decisions
- Real-time sync edge cases
- AI-to-AI integration (recursive problem)
- Architectural trade-off decisions

### 5. Key Learnings
- How to prompt for better code quality
- When to trust AI vs verify manually
- Iterative refinement of AI outputs
- Combining multiple AI tools effectively
- AI limitations with complex async logic

---

## Demo Video Requirements (Pass/Fail - REQUIRED)

**Duration:** 3-5 minutes

**Required Content:**

### 1. Real-time Collaboration Demo (60 seconds)
- Split screen showing 2 users
- User A creates shapes
- User B moves shapes
- Show cursor tracking
- Demonstrate object locking
- Show presence indicators

### 2. AI Commands Demo (90 seconds)
- Execute 8+ different commands
- Show creation commands
- Show manipulation commands
- Show layout commands
- **Highlight complex commands** (login form, nav bar)
- Show multi-user AI usage

### 3. Advanced Features Walkthrough (60 seconds)
- Demonstrate undo/redo
- Show keyboard shortcuts in action
- Use copy/paste
- Show z-index management
- Demonstrate alignment tools
- Show collaborative comments

### 4. Architecture Explanation (30 seconds)
- High-level system diagram
- Explain Firebase real-time sync
- Explain AI integration
- Mention performance achievements

**Production Quality:**
- Clear audio (use microphone, not laptop mic)
- Smooth screen recording (60 FPS)
- No background noise
- Professional presentation
- Edited (remove dead air)

---

## Bonus Points Strategy (+5 pts maximum)

### Innovation (+2 pts)
**AI-Powered Design Suggestions:**
- AI analyzes current canvas layout
- Suggests improvements (alignment, spacing, colors)
- "Smart snap" - AI predicts where user wants to place object
- Auto-complete for common patterns

**Implementation:**
- Add "Suggest Improvements" button
- AI analyzes getCanvasState()
- Returns suggestions as natural language + actions
- User can accept/reject suggestions

### Polish (+2 pts)
**Exceptional UX/UI:**
- Smooth animations (fade in/out, slide, scale)
- Professional color scheme (design system)
- Polished toolbar with icons
- Onboarding tutorial
- Keyboard shortcut cheat sheet (press `?`)
- Toast notifications for actions
- Loading skeletons
- Empty states with helpful messages

**Design System:**
- Consistent spacing (8px grid)
- Color palette (primary, secondary, accent, neutral)
- Typography scale
- Button variants
- Shadow levels

### Scale (+1 pt)
**Performance Beyond Targets:**
- Demonstrate 1000+ objects at 60 FPS
- Demonstrate 10+ concurrent users
- Load test results showing capacity
- Performance monitoring dashboard

**Implementation:**
- Object virtualization (only render visible objects)
- Web workers for heavy computation
- Optimized Firestore queries
- CDN for static assets

---

## Development Timeline (7 Days)

### Day 1: Multi-select & Layer Management
**Goal:** Complete Section 2 requirements
- Implement multi-select (shift-click, drag-to-select)
- Add Z-index management (Tier 2 feature)
- Add duplicate functionality
- Test with multiple users

### Day 2-3: AI Canvas Agent - Foundation
**Goal:** Core AI functionality working
- Set up OpenAI/Claude integration
- Implement function calling schema
- Create AI service layer
- Build basic AI commands (creation, manipulation)
- Add AI input UI
- Test command parsing

### Day 4: AI Canvas Agent - Advanced
**Goal:** Complex commands + polish
- Implement layout commands
- **Implement complex commands** (login form, nav bar, card layout)
- Optimize for <2s response time
- Add loading states and error handling
- Test multi-user AI usage
- Test all 8+ commands

### Day 5: Advanced Features
**Goal:** Complete Tier 1 & Tier 2 features
- Implement undo/redo
- Add keyboard shortcuts
- Implement copy/paste
- Add alignment tools
- Implement collaborative comments (Tier 3)
- Test all features

### Day 6: Polish & Optimization
**Goal:** Bonus points + quality improvements
- Add animations and polish
- Implement AI design suggestions (bonus)
- Performance testing and optimization
- Test with 1000+ objects
- Test with 10+ users
- Fix bugs

### Day 7: Documentation & Demo
**Goal:** Complete all deliverables
- Write comprehensive README
- Create ARCHITECTURE.md
- **Write AI Development Log**
- **Record demo video**
- Final deployment
- Final testing
- Submit project

---

## Risk Mitigation

### High Risk Items
1. **AI response time >2 seconds**
   - Mitigation: Use GPT-4-turbo, optimize prompts, add caching
   
2. **Complex commands not working well**
   - Mitigation: Extensive testing, fallback to simpler layouts, clear error messages

3. **Performance degradation with new features**
   - Mitigation: Performance testing after each feature, profiling, optimization

4. **Running out of time**
   - Mitigation: Prioritize AI agent and required features first, cut bonus features if needed

### Medium Risk Items
1. **Multi-user AI conflicts**
   - Mitigation: Queue AI requests, show which user triggered AI action

2. **Undo/redo with real-time sync**
   - Mitigation: Undo only own actions, not other users' actions

3. **Video recording quality**
   - Mitigation: Practice recording, use quality tools (Loom, ScreenFlow)

---

## Success Criteria

### Minimum Viable Final (85 points - B)
- ✅ All MVP features working (30 pts Section 1)
- ✅ Core canvas features (16 pts Section 2)
- ✅ AI agent with 6-7 commands (16-18 pts Section 4)
- ✅ 2-3 advanced features (10-12 pts Section 3)
- ✅ Clean code (8 pts Section 5)
- ✅ Good documentation (4 pts Section 6)
- ✅ Pass AI log & demo (0 penalty)

### Target Final (95 points - A)
- ✅ All MVP features excellent (30 pts Section 1)
- ✅ All canvas features (20 pts Section 2)
- ✅ AI agent with 8+ commands, complex working (23-25 pts Section 4)
- ✅ 5 advanced features across tiers (13-15 pts Section 3)
- ✅ Excellent code quality (10 pts Section 5)
- ✅ Excellent documentation (5 pts Section 6)
- ✅ Pass AI log & demo perfectly (0 penalty)
- ✅ +3-5 bonus points

---