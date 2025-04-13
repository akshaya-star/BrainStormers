async function removeFromLibrary(itemId, itemType) {
    try {
        if (!itemId) {
            console.error('Missing item ID in removeFromLibrary');
            return;
        }
        
        // If itemType is missing, try to infer it
        if (!itemType) {
            // Try to find the item in the library
            const bookItem = userLibrary.books.find(book => book.id === itemId);
            if (bookItem) {
                itemType = 'book';
            } else {
                const courseItem = userLibrary.courses.find(course => course.id === itemId);
                if (courseItem) {
                    itemType = 'course';
                } else {
                    // Default type if we can't determine
                    itemType = 'item';
                }
            }
        }
        
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to remove this ${itemType} from your library?`)) {
            return;
        }
        
        // Check if it's from web search (web search items might have specific identifiers)
        const isWebSearchItem = 
            (itemId && itemId.toString().includes('web-')) || 
            (itemType === 'websearch') || 
            (itemType === 'web_result') ||
            (userLibrary.books.some(book => book.id === itemId && (book.fromWebSearch || book.source === 'web_search'))) ||
            (userLibrary.courses.some(course => course.id === itemId && (course.fromWebSearch || course.source === 'web_search')));
        
        // For web search items, we don't need to make an API call
        if (isWebSearchItem) {
            // Just update local storage and UI
            // Remove from both books and courses collections to be safe
            userLibrary.books = userLibrary.books.filter(book => book.id !== itemId);
            userLibrary.courses = userLibrary.courses.filter(course => course.id !== itemId);
            saveLibraryData();
            updateLibraryView();
            showNotification(`Item removed from library successfully`, 'success');
            return;
        }
        
        const response = await fetch(`/api/learning/remove-from-library`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId,
                itemType
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to remove item from library');
        }

        // Update local storage based on item type
        if (itemType === 'book') {
            const books = JSON.parse(localStorage.getItem('userBooks') || '[]');
            const updatedBooks = books.filter(book => book.id !== itemId);
            localStorage.setItem('userBooks', JSON.stringify(updatedBooks));
        } else if (itemType === 'course') {
            const courses = JSON.parse(localStorage.getItem('userCourses') || '[]');
            const updatedCourses = courses.filter(course => course.id !== itemId);
            localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
        }

        // Update the library view
        updateLibraryView();
        
        // Show success notification
        showNotification('Item removed from library successfully', 'success');
    } catch (error) {
        console.error('Error removing item:', error);
        // Try to remove the item from local library anyway
        try {
            if (itemId) {
                userLibrary.books = userLibrary.books.filter(book => book.id !== itemId);
                userLibrary.courses = userLibrary.courses.filter(course => course.id !== itemId);
                saveLibraryData();
                updateLibraryView();
                showNotification('Item removed from local library', 'success');
            }
        } catch (e) {
            console.error('Failed to remove item as fallback:', e);
        }
    }
} 