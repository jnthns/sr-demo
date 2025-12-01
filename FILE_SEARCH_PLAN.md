# File Search (RAG) Integration Plan

## Overview
Integrate Google's File Search (RAG) tool into a new page that allows users to upload files, create File Search stores, and chat with documents using Gemini's retrieval-augmented generation capabilities.

## Architecture

### 1. New Page: `/app/filesearch/page.js`
- Main page for File Search functionality
- Combines file management and chat interface
- Two-panel layout: file management (left) + chat (right)

### 2. API Routes

#### `/app/api/filesearch/stores/route.js`
- `POST` - Create a new File Search store
- `GET` - List all File Search stores for the user
- `DELETE` - Delete a File Search store

#### `/app/api/filesearch/upload/route.js`
- `POST` - Upload file to File Search store
  - Handles file upload (multipart/form-data)
  - Validates file type and size (max 100MB)
  - Initiates upload to File Search store
  - Returns operation ID for status tracking

#### `/app/api/filesearch/operations/route.js`
- `GET /api/filesearch/operations/[operationId]` - Check upload/import status
  - Polls operation status
  - Returns completion status and file details

#### `/app/api/filesearch/chat/route.js`
- `POST` - Generate content with File Search tool enabled
  - Accepts message, history, and fileSearchStoreNames
  - Configures Gemini with File Search tool
  - Returns response with grounding metadata (citations)

### 3. Service Layer

#### `/lib/fileSearchService.js`
- `createStore(displayName)` - Create File Search store
- `listStores()` - Get all stores
- `deleteStore(storeName)` - Delete a store
- `uploadFile(file, storeName, displayName)` - Upload file to store
- `checkOperationStatus(operationId)` - Poll operation status
- `sendMessageWithFileSearch(message, history, storeNames)` - Chat with File Search

### 4. UI Components

#### File Management Panel
- Store selector/dropdown
- Create new store button
- File upload area (drag & drop)
- File list with status indicators
- Delete file/store actions
- Store size indicator

#### Chat Panel
- Similar to existing chat interface
- File Search indicator (shows which stores are active)
- Citations display (from grounding metadata)
- Toggle File Search on/off per store

## Implementation Steps

### Phase 1: Backend API Setup

1. **Create File Search Service** (`lib/fileSearchService.js`)
   - Initialize GoogleGenAI client
   - Implement store CRUD operations
   - Implement file upload with operation tracking
   - Implement chat with File Search tool

2. **Create API Routes**
   - `/api/filesearch/stores/route.js` - Store management
   - `/api/filesearch/upload/route.js` - File upload
   - `/api/filesearch/operations/[operationId]/route.js` - Status checking
   - `/api/filesearch/chat/route.js` - Chat with File Search

### Phase 2: Frontend Page

3. **Create File Search Page** (`/app/filesearch/page.js`)
   - Two-column responsive layout
   - File management sidebar
   - Chat interface main area
   - State management for stores, files, and chat

4. **File Upload Component**
   - Drag & drop zone
   - File type validation
   - Size validation (100MB max)
   - Progress indicator
   - Error handling

5. **Store Management UI**
   - Store list/selector
   - Create store modal
   - Store info (name, file count, size)
   - Delete confirmation

6. **Chat Interface**
   - Message history with citations
   - File Search toggle per store
   - Active stores indicator
   - Citation display (from grounding metadata)

### Phase 3: Integration & Polish

7. **Add Navigation Link**
   - Update `app/components/Navigation.js` to include File Search page

8. **Error Handling**
   - Network errors
   - File size/type errors
   - Operation timeout handling
   - API quota errors

9. **Loading States**
   - File upload progress
   - Operation polling status
   - Chat loading indicators

10. **Analytics Integration**
    - Track file uploads
    - Track store creation
    - Track File Search queries
    - Track citation usage

## Technical Details

### File Search Tool Configuration
```javascript
config: {
  tools: [{
    fileSearch: {
      fileSearchStoreNames: [storeName]
    }
  }]
}
```

### Supported File Types
- Documents: PDF, DOCX, TXT, MD, HTML
- Code: JS, TS, PY, JAVA, etc.
- Data: CSV, JSON, XML
- See full list in documentation

### Rate Limits
- Max file size: 100MB per file
- Free tier: 1GB total storage
- Paid tiers: 10GB - 1TB

### Pricing
- Embeddings: $0.15 per 1M tokens (at indexing)
- Storage: Free
- Query embeddings: Free
- Retrieved tokens: Regular context pricing

### Grounding Metadata
Response includes `groundingMetadata` with:
- `groundingChunks` - Retrieved document chunks
- `supportAttributions` - Source citations
- `searchEntryPoint` - Search query used

## File Structure

```
app/
├── filesearch/
│   └── page.js                    # Main File Search page
├── api/
│   └── filesearch/
│       ├── stores/
│       │   └── route.js          # Store CRUD
│       ├── upload/
│       │   └── route.js          # File upload
│       ├── operations/
│       │   └── [operationId]/
│       │       └── route.js      # Operation status
│       └── chat/
│           └── route.js           # Chat with File Search
lib/
└── fileSearchService.js           # File Search service layer
```

## User Flow

1. User navigates to File Search page
2. Creates a File Search store (or selects existing)
3. Uploads files (drag & drop or file picker)
4. Waits for files to be indexed (polling operation status)
5. Asks questions in chat interface
6. Receives answers with citations from uploaded files
7. Can toggle File Search on/off per store
8. Can manage files (view, delete)

## Error Scenarios

- File too large (>100MB)
- Unsupported file type
- Store size limit exceeded
- Operation timeout
- API quota exceeded
- Network errors

## Future Enhancements

- Multiple file selection
- Batch upload
- File preview
- Search within files
- Export chat with citations
- Store sharing/collaboration
- File versioning

