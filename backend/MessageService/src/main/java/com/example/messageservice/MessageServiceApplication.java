package com.example.messageservice;

import com.example.messageservice.model.Conversation;
import com.example.messageservice.model.Message;
import com.example.messageservice.model.MessageType;
import com.example.messageservice.model.UserType;
import com.example.messageservice.repository.ConversationRepository;
import com.example.messageservice.repository.MessageRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MessageServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MessageServiceApplication.class, args);
    }
    @Bean
    CommandLineRunner initData(ConversationRepository conversationRepo, MessageRepository messageRepo) {
        return args -> {
            if (conversationRepo.count() == 0) {
                System.out.println("Creating test data...");

                // Create test conversation
                Conversation conversation = Conversation.builder()
                        .bookingId(1001L)
                        .customerId(1L)
                        .contractorId(2L)
                        .customerUnreadCount(0)
                        .contractorUnreadCount(0)
                        .build();

                conversation = conversationRepo.save(conversation);

                // Create test messages
                Message message1 = Message.builder()
                        .conversationId(conversation.getId())
                        .senderId(1L)
                        .senderType(UserType.CUSTOMER)
                        .content("Hello! I'd like to book your dog walking service.")
                        .messageType(MessageType.TEXT)
                        .isRead(true)
                        .build();
                messageRepo.save(message1);

                Message message2 = Message.builder()
                        .conversationId(conversation.getId())
                        .senderId(2L)
                        .senderType(UserType.CONTRACTOR)
                        .content("Hi! I'd be happy to help. When would you like me to walk your dog?")
                        .messageType(MessageType.TEXT)
                        .isRead(false)
                        .build();
                messageRepo.save(message2);

                System.out.println("✅ Test data created!");
            }
        };
    }
}

