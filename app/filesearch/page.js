'use client'

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { logEvent } from "../../lib/amplitude"

const MarkdownRenderer = dynamic(() => import("../components/MarkdownRenderer"), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-500 dark:text-gray-400">Loading message...</p>
});

export default function FileSearchPage() {
  // State management
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Load stores on mount
  useEffect(() => {
    loadStores();
    initializeChat();
  }, []);

  // Poll operation status for uploading files
  useEffect(() => {
    const pollingIntervals = {};

    Object.keys(uploadProgress).forEach(operationName => {
      const progress = uploadProgress[operationName];
      if (!progress.done && !progress.error) {
        pollingIntervals[operationName] = setInterval(async () => {
          try {
            const response = await fetch(`/api/filesearch/operations/${encodeURIComponent(operationName)}`);
            
            if (!response.ok) {
              // Don't fail immediately on 500s - operation might still be processing
              if (response.status === 500) {
                console.warn(`Operation status check returned 500 for ${operationName}, but operation may still be processing`);
                // Try to parse error for logging
                try {
                  const errorText = await response.text();
                  console.warn('500 error details:', errorText.substring(0, 200));
                } catch (e) {
                  // Ignore parse errors
                }
                return; // Continue polling
              }
              
              // For other errors, try to parse JSON
              let errorData;
              try {
                const errorText = await response.text();
                errorData = JSON.parse(errorText);
              } catch (e) {
                errorData = { error: `HTTP ${response.status}` };
              }
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            let data;
            try {
              const responseText = await response.text();
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Failed to parse operation status response:', parseError);
              throw new Error('Invalid response format from server');
            }
            
            if (data.success) {
              setUploadProgress(prev => ({
                ...prev,
                [operationName]: {
                  ...prev[operationName],
                  done: data.operation.done,
                  file: data.operation.response?.file || null,
                  error: data.operation.error || null
                }
              }));

              if (data.operation.done) {
                clearInterval(pollingIntervals[operationName]);
                if (data.operation.response?.file) {
                  loadFiles(); // Reload files list
                  logEvent('File Upload Completed', {
                    store_name: selectedStore,
                    file_name: data.operation.response.file.displayName
                  });
                }
              }
            } else {
              // If operation check fails but we have an operation, keep polling
              console.warn('Operation status check returned success=false, but continuing to poll');
            }
          } catch (error) {
            // Only stop polling if it's a clear error (not a transient 500)
            if (error.message && !error.message.includes('500') && !error.message.includes('Transient')) {
              console.error('Error polling operation:', error);
              clearInterval(pollingIntervals[operationName]);
              setUploadProgress(prev => ({
                ...prev,
                [operationName]: {
                  ...prev[operationName],
                  error: 'Failed to check upload status'
                }
              }));
            } else {
              // For 500s, just log and continue polling
              console.warn('Transient error polling operation (will retry):', error.message);
            }
          }
        }, 5000); // Poll every 5 seconds (reduced frequency to avoid too many requests)
      }
    });

    return () => {
      Object.values(pollingIntervals).forEach(interval => clearInterval(interval));
    };
  }, [uploadProgress, selectedStore]);

  // Load files when selected store changes
  useEffect(() => {
    if (selectedStore) {
      loadFiles();
    } else {
      setFiles([]);
    }
  }, [selectedStore]);

  // Initialize chat with welcome message
  const initializeChat = () => {
    const welcomeMessage = {
      text: `# File Search Assistant 📚

I can help you search and answer questions about your uploaded documents using **File Search (RAG)**.

**To get started:**
1. Create or select a File Search store
2. Upload files to the store
3. Wait for files to be indexed
4. Ask questions about your documents!

I'll provide answers with citations from your uploaded files.`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  // Load all File Search stores
  const loadStores = async () => {
    try {
      const response = await fetch('/api/filesearch/stores');
      const data = await response.json();
      
      if (data.success) {
        setStores(data.stores || []);
        if (data.stores && data.stores.length > 0 && !selectedStore) {
          setSelectedStore(data.stores[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      setError('Failed to load File Search stores');
    }
  };

  // Load files when selected store changes
  useEffect(() => {
    if (selectedStore) {
      loadFiles();
    } else {
      setFiles([]);
    }
  }, [selectedStore]);

  // Create a new File Search store
  const createStore = async () => {
    if (!newStoreName.trim()) {
      setError('Store name is required');
      return;
    }

    try {
      const response = await fetch('/api/filesearch/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newStoreName.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateStoreModal(false);
        setNewStoreName('');
        await loadStores();
        setSelectedStore(data.name);
        logEvent('File Search Store Created', { store_name: data.displayName });
      } else {
        setError(data.error || 'Failed to create store');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      setError('Failed to create store');
    }
  };

  // Delete a File Search store
  const deleteStore = async (storeName) => {
    if (!confirm('Are you sure you want to delete this store? All files will be removed.')) {
      return;
    }

    try {
      const response = await fetch(`/api/filesearch/stores?name=${encodeURIComponent(storeName)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadStores();
        if (selectedStore === storeName) {
          setSelectedStore(null);
          setFiles([]);
        }
        logEvent('File Search Store Deleted', { store_name: storeName });
      } else {
        setError(data.error || 'Failed to delete store');
      }
    } catch (error) {
      console.error('Error deleting store:', error);
      setError('Failed to delete store');
    }
  };

  // Load files for selected store
  const loadFiles = async () => {
    if (!selectedStore) {
      setFiles([]);
      return;
    }

    try {
      const response = await fetch(`/api/filesearch/stores?name=${encodeURIComponent(selectedStore)}`);
      const data = await response.json();
      
      if (data.success && data.store) {
        // Update files list from store details
        const storeFiles = data.store.files || [];
        setFiles(storeFiles.map(file => ({
          name: file.displayName || file.name,
          storeName: selectedStore,
          mimeType: file.mimeType,
          fileId: file.name
        })));
        
        console.log('Files loaded from store:', {
          storeName: selectedStore,
          fileCount: storeFiles.length,
          files: storeFiles.map(f => ({
            name: f.displayName || f.name,
            mimeType: f.mimeType
          }))
        });
      } else {
        console.warn('Failed to load files from store:', data.error);
        // Keep local tracking as fallback
      }
    } catch (error) {
      console.error('Error loading files:', error);
      // Keep local tracking as fallback
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!selectedStore) {
      setError('Please select or create a File Search store first');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeName', selectedStore);
      formData.append('displayName', file.name);

      const response = await fetch('/api/filesearch/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('File upload initiated successfully:', {
          operationName: data.operation.name,
          fileName: file.name,
          storeName: selectedStore,
          done: data.operation.done,
          uploadLocation: 'Google Gemini File Search Store'
        });
        
        // Track upload progress
        setUploadProgress(prev => ({
          ...prev,
          [data.operation.name]: {
            fileName: file.name,
            done: data.operation.done,
            file: data.operation.file,
            error: null
          }
        }));

        // If done immediately, add to files list
        if (data.operation.done && data.operation.file) {
          setFiles(prev => [...prev, {
            name: data.operation.file.displayName,
            storeName: selectedStore
          }]);
        }

        logEvent('File Upload Started', {
          store_name: selectedStore,
          file_name: file.name,
          file_size: file.size,
          operation_name: data.operation.name
        });
      } else {
        setError(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        handleFileUpload(file);
      });
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        handleFileUpload(file);
      });
    }
  };

  // Send chat message with File Search
  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || isLoading) return;

    if (!selectedStore) {
      setError('Please select a File Search store first');
      return;
    }

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    logEvent('File Search Query', {
      message: messageText,
      store_name: selectedStore
    });

    try {
      // Prepare history for the API call
      const history = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await fetch('/api/filesearch/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: history,
          fileSearchStoreNames: [selectedStore]
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botMessage = {
        text: data.response || 'I received your message but couldn\'t generate a response.',
        sender: 'bot',
        timestamp: new Date(),
        groundingMetadata: data.groundingMetadata,
        usage: data.usage
      };

      setMessages([...newMessages, botMessage]);

      logEvent('File Search Response Received', {
        response_length: botMessage.text.length,
        has_citations: !!data.groundingMetadata,
        usage: data.usage
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'An error occurred');

      const errorBotMessage = {
        text: `Error: ${error.message || 'An error occurred while processing your request'}`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages([...newMessages, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format citations from grounding metadata
  const formatCitations = (groundingMetadata) => {
    if (!groundingMetadata) return null;

    const citations = [];
    
    // Extract support attributions
    if (groundingMetadata.supportAttributions) {
      groundingMetadata.supportAttributions.forEach((attribution, index) => {
        if (attribution.source) {
          citations.push({
            index: index + 1,
            source: attribution.source.uri || attribution.source.fileUri || 'Unknown source',
            title: attribution.source.title || 'Document',
            chunk: attribution.chunk?.chunkText || null
          });
        }
      });
    }

    return citations.length > 0 ? citations : null;
  };

  return (
    <>
      <main className="flex min-h-screen flex-col p-6">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-6">File Search (RAG) Assistant</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - File Management */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">File Search Stores</h2>
                  <button
                    onClick={() => setShowCreateStoreModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    + New Store
                  </button>
                </div>

                {/* Store Selector */}
                <div className="space-y-2 mb-4">
                  {stores.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No stores yet. Create one to get started!
                    </p>
                  ) : (
                    stores.map((store) => (
                      <div
                        key={store.name}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          selectedStore === store.name
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                        }`}
                        onClick={() => setSelectedStore(store.name)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{store.displayName || 'Unnamed Store'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {store.name}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStore(store.name);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* File Upload Area */}
                {selectedStore && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isDragging ? 'Drop files here' : 'Drag & drop files or'}
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading...' : 'Browse Files'}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Max 100MB per file
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium mb-2">Upload Status</p>
                    {Object.entries(uploadProgress).map(([operationName, progress]) => (
                      <div key={operationName} className="text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="truncate">{progress.fileName}</span>
                          <span className={progress.done ? 'text-green-600' : 'text-blue-600'}>
                            {progress.done ? '✓ Indexed' : progress.error ? '✗ Error' : '⏳ Processing...'}
                          </span>
                        </div>
                        {!progress.done && !progress.error && (
                          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        )}
                        {progress.error && (
                          <p className="text-red-500 text-xs mt-1">{progress.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chat Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg h-[calc(100vh-200px)] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Chat with Documents</h2>
                  {selectedStore && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>File Search Active</span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                  {messages.map((msg, index) => {
                    const citations = formatCitations(msg.groundingMetadata);
                    return (
                      <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : msg.isError
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                            : 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                        }`}>
                          {msg.sender === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <MarkdownRenderer
                              className="text-sm prose prose-sm max-w-none dark:prose-invert"
                              content={msg.text}
                            />
                          )}
                        </div>
                        
                        {/* Citations */}
                        {citations && (
                          <div className="mt-2 max-w-[80%]">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sources:</p>
                            <div className="space-y-1">
                              {citations.map((citation, idx) => (
                                <div key={idx} className="text-xs bg-gray-50 dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-700">
                                  <p className="font-medium">{citation.index}. {citation.title}</p>
                                  {citation.chunk && (
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {citation.chunk}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {isLoading && (
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 dark:bg-zinc-700 p-3 rounded-lg rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="flex-grow rounded-md border border-gray-300 shadow-sm p-3 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={selectedStore ? "Ask a question about your documents..." : "Select a store first..."}
                    disabled={isLoading || !selectedStore}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim() || !selectedStore}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition flex items-center space-x-2"
                  >
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Store Modal */}
        {showCreateStoreModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Create File Search Store</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Store Name</label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                    placeholder="My Document Store"
                    onKeyPress={(e) => e.key === 'Enter' && createStore()}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowCreateStoreModal(false);
                      setNewStoreName('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createStore}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

