// frontend/pet-app-frontend/src/utils/bookingService.js
import { getAccessToken } from './api';

const BOOKING_SERVICE_URL = 'http://localhost:8083/api';
const MESSAGE_SERVICE_URL = 'http://localhost:8084/api';

// Helper function for authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAccessToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.statusText} - ${errorText}`);
    }

    return response;
};

// Enhanced booking creation that also creates a conversation
export const createBookingWithChat = async (bookingData) => {
    try {
        // Step 1: Create the booking
        const bookingResponse = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings`, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });

        const booking = await bookingResponse.json();
        console.log('✅ Booking created:', booking);

        // Step 2: If booking is auto-confirmed (some services might do this), create conversation
        if (booking.status === 'CONFIRMED') {
            await createConversationForBooking(booking);
        }

        return booking;
    } catch (error) {
        console.error('Error creating booking with chat:', error);
        throw error;
    }
};

// Enhanced booking acceptance that also creates a conversation
export const acceptBookingWithChat = async (bookingId) => {
    try {
        // Step 1: Accept the booking
        const acceptResponse = await makeAuthenticatedRequest(
            `${BOOKING_SERVICE_URL}/bookings/${bookingId}/accept`,
            { method: 'PUT' }
        );

        const booking = await acceptResponse.json();
        console.log('✅ Booking accepted:', booking);

        // Step 2: Create conversation for the accepted booking
        await createConversationForBooking(booking);

        return booking;
    } catch (error) {
        console.error('Error accepting booking with chat:', error);
        throw error;
    }
};

// Helper function to create a conversation for a booking
export const createConversationForBooking = async (booking) => {
    try {
        // Check if conversation already exists
        const checkResponse = await makeAuthenticatedRequest(
            `${MESSAGE_SERVICE_URL}/conversations/booking/${booking.id}`
        );

        if (checkResponse.ok) {
            console.log('💬 Conversation already exists for booking:', booking.id);
            return await checkResponse.json();
        }
    } catch (error) {
        // If 404, conversation doesn't exist, so we'll create it
        if (error.message.includes('404')) {
            console.log('No existing conversation, creating new one...');
        } else {
            throw error;
        }
    }

    try {
        // Create new conversation
        const conversationData = {
            bookingId: booking.id,
            customerId: booking.customerId,
            contractorId: booking.contractorId
        };

        const createResponse = await makeAuthenticatedRequest(
            `${MESSAGE_SERVICE_URL}/conversations`,
            {
                method: 'POST',
                body: JSON.stringify(conversationData)
            }
        );

        const conversation = await createResponse.json();
        console.log('💬 Conversation created for booking:', booking.id, conversation);

        // Send initial system message
        await sendInitialMessage(conversation.id, booking);

        return conversation;
    } catch (error) {
        // Log error but don't throw - chat creation failure shouldn't break booking
        console.error('Error creating conversation for booking:', error);
        return null;
    }
};

// Send an initial system message to the conversation
const sendInitialMessage = async (conversationId, booking) => {
    try {
        const message = {
            conversationId: conversationId,
            senderId: 0, // System message
            senderType: 'SYSTEM',
            content: `Chat created for booking: ${booking.serviceName || 'Pet Service'} on ${new Date(booking.startTime).toLocaleDateString()}`,
            type: 'SYSTEM'
        };

        // This would typically go through WebSocket, but we can also use REST API
        await makeAuthenticatedRequest(`${MESSAGE_SERVICE_URL}/messages`, {
            method: 'POST',
            body: JSON.stringify(message)
        });
    } catch (error) {
        console.error('Error sending initial message:', error);
    }
};

// Get or create conversation for existing booking
export const ensureBookingHasConversation = async (bookingId) => {
    try {
        // First, get the booking details
        const bookingResponse = await makeAuthenticatedRequest(
            `${BOOKING_SERVICE_URL}/bookings/${bookingId}`
        );

        const booking = await bookingResponse.json();

        // Only create conversation for confirmed bookings
        if (booking.status !== 'CONFIRMED') {
            console.log('⚠️ Cannot create chat for booking with status:', booking.status);
            return null;
        }

        // Try to create conversation
        return await createConversationForBooking(booking);
    } catch (error) {
        console.error('Error ensuring booking has conversation:', error);
        throw error;
    }
};

// Batch create conversations for all confirmed bookings without chats
export const createMissingConversations = async () => {
    try {
        console.log('🔍 Checking for bookings without conversations...');

        // Get user role to determine which endpoint to use
        const userRole = localStorage.getItem('userRole') || 'CUSTOMER';
        const endpoint = userRole === 'CUSTOMER' ? 'customer' : 'contractor';

        // Get all bookings
        const bookingsResponse = await makeAuthenticatedRequest(
            `${BOOKING_SERVICE_URL}/bookings/${endpoint}`
        );

        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.content || bookingsData;

        // Filter confirmed bookings
        const confirmedBookings = bookings.filter(b =>
            b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED'
        );

        console.log(`Found ${confirmedBookings.length} confirmed bookings`);

        // Check each booking for conversation
        let created = 0;
        for (const booking of confirmedBookings) {
            try {
                const checkResponse = await fetch(
                    `${MESSAGE_SERVICE_URL}/conversations/booking/${booking.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${getAccessToken()}`
                        }
                    }
                );

                if (!checkResponse.ok) {
                    // No conversation exists, create one
                    console.log(`Creating conversation for booking ${booking.id}...`);
                    const result = await createConversationForBooking(booking);
                    if (result) {
                        created++;
                    }
                } else {
                    console.log(`Conversation already exists for booking ${booking.id}`);
                }
            } catch (error) {
                console.error(`Failed to check/create conversation for booking ${booking.id}:`, error);
            }
        }

        console.log(`✅ Created ${created} missing conversations`);
        return created;
    } catch (error) {
        console.error('Error creating missing conversations:', error);
        throw error;
    }
};

// Export all functions
export default {
    createBookingWithChat,
    acceptBookingWithChat,
    createConversationForBooking,
    ensureBookingHasConversation,
    createMissingConversations
};