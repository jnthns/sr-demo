// File Search Service - Server-side service layer for File Search operations
import { GoogleGenAI } from '@google/genai';

class FileSearchService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for File Search service');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenAI({ apiKey });
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Create a new File Search store
   * @param {string} displayName - Display name for the store
   * @returns {Promise<Object>} Store object with name and displayName
   */
  async createStore(displayName = 'My File Search Store') {
    try {
      // Try SDK first, fallback to REST API
      if (this.genAI.fileSearchStores) {
        const fileSearchStore = await this.genAI.fileSearchStores.create({
          config: { displayName }
        });
        
        return {
          success: true,
          name: fileSearchStore.name,
          displayName: fileSearchStore.displayName || displayName
        };
      }

      // Fallback to REST API
      const response = await fetch(`${this.baseUrl}/fileSearchStores?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const fileSearchStore = await response.json();
      
      return {
        success: true,
        name: fileSearchStore.name,
        displayName: fileSearchStore.displayName || displayName
      };
    } catch (error) {
      console.error('Error creating File Search store:', error);
      throw new Error(`Failed to create store: ${error.message}`);
    }
  }

  /**
   * List all File Search stores
   * @returns {Promise<Array>} Array of store objects
   */
  async listStores() {
    try {
      // Try SDK first, fallback to REST API
      if (this.genAI.fileSearchStores && typeof this.genAI.fileSearchStores.list === 'function') {
        const stores = await this.genAI.fileSearchStores.list();
        return {
          success: true,
          stores: stores.map(store => ({
            name: store.name,
            displayName: store.displayName,
          }))
        };
      }

      // Fallback to REST API
      const response = await fetch(`${this.baseUrl}/fileSearchStores?key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const stores = data.fileSearchStores || [];
      
      return {
        success: true,
        stores: stores.map(store => ({
          name: store.name,
          displayName: store.displayName,
        }))
      };
    } catch (error) {
      console.error('Error listing File Search stores:', error);
      throw new Error(`Failed to list stores: ${error.message}`);
    }
  }

  /**
   * Get details of a File Search store including files
   * @param {string} storeName - Name of the store
   * @returns {Promise<Object>} Store details with files
   */
  async getStoreDetails(storeName) {
    try {
      // Try SDK first, fallback to REST API
      if (this.genAI.fileSearchStores && typeof this.genAI.fileSearchStores.get === 'function') {
        const store = await this.genAI.fileSearchStores.get({ name: storeName });
        return {
          success: true,
          store: {
            name: store.name,
            displayName: store.displayName,
            files: store.files || []
          }
        };
      }

      // Fallback to REST API
      const response = await fetch(`${this.baseUrl}/${storeName}?key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const store = await response.json();
      
      return {
        success: true,
        store: {
          name: store.name,
          displayName: store.displayName,
          files: store.files || []
        }
      };
    } catch (error) {
      console.error('Error getting store details:', error);
      throw new Error(`Failed to get store details: ${error.message}`);
    }
  }

  /**
   * Delete a File Search store
   * @param {string} storeName - Name of the store to delete
   * @returns {Promise<Object>} Success status
   */
  async deleteStore(storeName) {
    try {
      // Try SDK first, fallback to REST API
      if (this.genAI.fileSearchStores && typeof this.genAI.fileSearchStores.delete === 'function') {
        await this.genAI.fileSearchStores.delete({ name: storeName });
        return {
          success: true,
          message: 'Store deleted successfully'
        };
      }

      // Fallback to REST API
      const response = await fetch(`${this.baseUrl}/${storeName}?key=${this.apiKey}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        message: 'Store deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting File Search store:', error);
      throw new Error(`Failed to delete store: ${error.message}`);
    }
  }

  /**
   * Upload a file to a File Search store
   * @param {Buffer|File} file - File to upload (Buffer from Next.js FormData)
   * @param {string} storeName - Name of the File Search store
   * @param {string} displayName - Display name for the file
   * @param {string} mimeType - MIME type of the file (optional)
   * @returns {Promise<Object>} Operation object for status tracking
   */
  async uploadFile(file, storeName, displayName, mimeType = null) {
    try {
      // Validate file size (100MB max)
      const fileSize = file.size || file.length || (Buffer.isBuffer(file) ? file.length : 0);
      if (fileSize > 100 * 1024 * 1024) {
        throw new Error('File size exceeds 100MB limit');
      }

      // The SDK expects the file as a Buffer or file path
      // We'll pass the buffer directly
      const fileToUpload = Buffer.isBuffer(file) ? file : Buffer.from(file);

      // Try SDK first, fallback to REST API
      if (this.genAI.fileSearchStores && typeof this.genAI.fileSearchStores.uploadToFileSearchStore === 'function') {
        const operation = await this.genAI.fileSearchStores.uploadToFileSearchStore({
          file: fileToUpload,
          fileSearchStoreName: storeName,
          config: {
            displayName: displayName || 'Uploaded File'
          }
        });

        return {
          success: true,
          operation: {
            name: operation.name,
            done: operation.done || false,
            file: operation.response?.file || null
          }
        };
      }

      // Fallback to REST API - Use uploadToFileSearchStore with resumable upload
      // According to docs: https://generativelanguage.googleapis.com/upload/v1beta/{parent}:uploadToFileSearchStore
      const fileMimeType = mimeType || 'application/octet-stream';
      
      // Use the upload endpoint format from documentation
      const uploadEndpoint = `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore?key=${this.apiKey}`;
      
      console.log('Uploading file to Google Gemini File Search Store:', {
        storeName: storeName,
        fileName: displayName,
        fileSize: fileSize,
        mimeType: fileMimeType,
        uploadEndpoint: uploadEndpoint.replace(this.apiKey, 'API_KEY_HIDDEN')
      });
      
      // Step 1: Initiate resumable upload
      const initResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
          'X-Goog-Upload-Header-Content-Type': fileMimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName || 'Uploaded File'
        })
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        let errorMessage = `HTTP ${initResponse.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        console.error('Upload initiation failed:', {
          status: initResponse.status,
          statusText: initResponse.statusText,
          headers: Object.fromEntries(initResponse.headers.entries()),
          errorText
        });
        throw new Error(`Failed to initiate upload: ${errorMessage}`);
      }

      // Extract upload URL - try multiple header name variations
      const responseHeaders = initResponse.headers;
      let uploadLocation = null;
      
      // Check all headers (case-insensitive)
      for (const [key, value] of responseHeaders.entries()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('upload-url') || lowerKey === 'location') {
          uploadLocation = value;
          break;
        }
      }
      
      // Log all headers for debugging
      const allHeaders = Object.fromEntries(responseHeaders.entries());
      console.log('Upload initiation response headers:', allHeaders);
      
      if (!uploadLocation) {
        // Try to get from response body if headers don't have it
        const responseText = await initResponse.text();
        console.log('Upload initiation response body:', responseText);
        throw new Error('Failed to get upload URL from server. Check console logs for response details.');
      }

      console.log('Upload location:', uploadLocation);

      // Step 2: Upload the file bytes
      const uploadResponse = await fetch(uploadLocation, {
        method: 'PUT',
        headers: {
          'Content-Length': fileSize.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: fileToUpload
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let errorMessage = `HTTP ${uploadResponse.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        console.error('File upload error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText
        });
        throw new Error(`Failed to upload file: ${errorMessage}`);
      }

      // Parse the response - should contain operation details
      const responseText = await uploadResponse.text();
      let operation;
      try {
        operation = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse upload response:', responseText);
        throw new Error('Unexpected response format from upload endpoint');
      }

      console.log('Upload operation response:', {
        operationName: operation.name,
        done: operation.done,
        hasFile: !!operation.response?.file,
        fullOperation: JSON.stringify(operation).substring(0, 500)
      });

      return {
        success: true,
        operation: {
          name: operation.name,
          done: operation.done || false,
          file: operation.response?.file || null
        }
      };
    } catch (error) {
      console.error('Error uploading file to File Search store:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Check the status of an operation
   * @param {string} operationName - Name of the operation (format: operations/xxxxx or just xxxxx)
   * @returns {Promise<Object>} Operation status and result
   */
  async checkOperationStatus(operationName) {
    try {
      // Try SDK first, fallback to REST API
      if (this.genAI.operations && typeof this.genAI.operations.get === 'function') {
        try {
          const operation = await this.genAI.operations.get({ operation: operationName });
          
          return {
            success: true,
            done: operation.done,
            operation: {
              name: operation.name,
              done: operation.done,
              response: operation.response || null,
              error: operation.error || null
            }
          };
        } catch (sdkError) {
          console.warn('SDK operation check failed, falling back to REST API:', sdkError.message);
          // Fall through to REST API fallback
        }
      }

      // Fallback to REST API
      // The operation name from Google API can be in different formats:
      // 1. Full path: "fileSearchStores/.../upload/operations/..."
      // 2. Just operation ID: "operations/..."
      // 3. Just the ID part: "..."
      let normalizedOperationName = operationName;
      
      // If it already contains the full path (starts with fileSearchStores), use it as-is
      if (operationName.startsWith('fileSearchStores/')) {
        normalizedOperationName = operationName;
      } 
      // If it starts with operations/, use it as-is
      else if (operationName.startsWith('operations/')) {
        normalizedOperationName = operationName;
      }
      // Otherwise, assume it's just an operation ID and prepend operations/
      else {
        normalizedOperationName = `operations/${operationName}`;
      }

      // Try the operations endpoint - it might be in v1beta or v1
      const operationsUrl = `${this.baseUrl}/${normalizedOperationName}?key=${this.apiKey}`;
      
      console.log('Checking operation status via REST API:', {
        original: operationName,
        normalized: normalizedOperationName,
        url: operationsUrl.replace(this.apiKey, 'API_KEY_HIDDEN')
      });
      
      const response = await fetch(operationsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        // Handle 404 as operation not found (might not be ready yet)
        if (response.status === 404) {
          console.warn('Operation not found (might not be ready yet):', normalizedOperationName);
          return {
            success: true,
            done: false,
            operation: {
              name: normalizedOperationName,
              done: false,
              response: null,
              error: null,
              notFound: true
            }
          };
        }
        
        console.error('Operation status check failed:', {
          operationName: normalizedOperationName,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
        throw new Error(errorMessage);
      }

      const operation = await response.json();
      
      return {
        success: true,
        done: operation.done || false,
        operation: {
          name: operation.name,
          done: operation.done || false,
          response: operation.response || null,
          error: operation.error || null
        }
      };
    } catch (error) {
      console.error('Error checking operation status:', {
        operationName,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to check operation status: ${error.message}`);
    }
  }

  /**
   * Generate content with File Search tool enabled
   * @param {string} message - User message
   * @param {Array} history - Conversation history
   * @param {Array<string>} fileSearchStoreNames - Array of store names to search
   * @returns {Promise<Object>} Response with text and grounding metadata
   */
  async generateContentWithFileSearch(message, history = [], fileSearchStoreNames = []) {
    try {
      if (!fileSearchStoreNames || fileSearchStoreNames.length === 0) {
        throw new Error('At least one File Search store name is required');
      }

      // Verify stores exist and log details for debugging
      console.log('File Search - Verifying stores before chat:', {
        storeNames: fileSearchStoreNames,
        count: fileSearchStoreNames.length
      });

      for (const storeName of fileSearchStoreNames) {
        try {
          const storeDetails = await this.getStoreDetails(storeName);
          console.log('File Search - Store verified:', {
            storeName: storeName,
            displayName: storeDetails.store.displayName,
            fileCount: storeDetails.store.files?.length || 0,
            files: storeDetails.store.files?.map(f => ({
              name: f.name,
              displayName: f.displayName,
              mimeType: f.mimeType
            })) || []
          });
        } catch (error) {
          console.warn('File Search - Store verification failed:', {
            storeName: storeName,
            error: error.message
          });
          // Continue anyway - the store might still work
        }
      }

      // Build conversation history
      const contents = [];
      
      // Add conversation history if provided
      if (history && Array.isArray(history)) {
        history.forEach(msg => {
          contents.push({
            role: msg.role || (msg.sender === 'user' ? 'user' : 'model'),
            parts: [{ text: msg.text || msg.parts?.[0]?.text }]
          });
        });
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Generate content with File Search tool using Gemini 2.5 Flash
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          tools: [{
            fileSearch: {
              fileSearchStoreNames: fileSearchStoreNames
            }
          }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        }
      });

      // Extract response text
      const text = response.text;

      // Extract usage information
      const usage = response.usage || response.usageMetadata || {};
      const totalTokens = usage.totalTokenCount || usage.totalTokens || 0;

      // Extract grounding metadata (citations)
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

      return {
        success: true,
        response: text,
        tokenCount: totalTokens,
        usage: {
          prompt_tokens: usage.promptTokenCount || usage.promptTokens || 0,
          candidates_tokens: usage.candidatesTokenCount || usage.candidatesTokens || 0,
          total_tokens: totalTokens
        },
        groundingMetadata: groundingMetadata,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating content with File Search:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }
}

// Export a factory function to create service instances
export function createFileSearchService(apiKey) {
  return new FileSearchService(apiKey);
}

// Export the class for direct instantiation if needed
export { FileSearchService };

