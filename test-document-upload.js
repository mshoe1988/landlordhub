// Test script to check document upload functionality
// Run this in the browser console to test document creation

async function testDocumentCreation() {
  try {
    // Test if we can create a document directly
    const testDocument = {
      user_id: 'test-user-id',
      property_id: 'test-property-id', 
      name: 'test-document.pdf',
      type: 'Lease',
      file_url: 'https://example.com/test.pdf',
      upload_date: new Date().toISOString()
    }
    
    console.log('Testing document creation with:', testDocument)
    
    // Import the database function
    const { createDocument } = await import('./src/lib/database.ts')
    
    const result = await createDocument(testDocument)
    console.log('Document creation result:', result)
    
  } catch (error) {
    console.error('Document creation test failed:', error)
  }
}

// Run the test
testDocumentCreation()










