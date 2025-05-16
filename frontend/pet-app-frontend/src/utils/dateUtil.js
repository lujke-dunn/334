export const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    if (diffInMs < 1000 * 60) {
      // Less than a minute ago
      return 'Just now';
    } else if (diffInHours < 1) {
      // Less than an hour ago
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      // Same day
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 2) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // This week
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      // Older than a week
      return date.toLocaleDateString();
    }
  };
  
  export const formatConversationTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 1 week
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  export const isToday = (timestamp) => {
    if (!timestamp) return false;
    
    const date = new Date(timestamp);
    const today = new Date();
    
    return date.toDateString() === today.toDateString();
  };
  
  export const isYesterday = (timestamp) => {
    if (!timestamp) return false;
    
    const date = new Date(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.toDateString() === yesterday.toDateString();
  };