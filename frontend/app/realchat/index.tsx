import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import io, { Socket } from 'socket.io-client';

// Define types
type Message = {
  id: string;
  text: string;
  senderId: string;
  senderType: string;
  timestamp: Date;
  isRead: boolean;
};

const PatientChat: React.FC = () => {
  // State
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Refs
  const socket = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList | null>(null);
  
  // Generate a random user ID for anonymous patient
  const patientId = useRef<string>(`user_${Math.random().toString(36).substring(2, 9)}`);
  // Fixed doctor ID
  const doctorId = useRef<string>('main_doctor');
  const chatId = useRef<string>(`${patientId.current}-${doctorId.current}`);
  
  // Setup socket connection
  useEffect(() => {
    // Connect to your socket server
    socket.current = io('http://localhost:3000', {
      transports: ['websocket'],
      query: {
        userId: patientId.current,
        userType: 'patient',
      }
    });

    // Handle connection
    socket.current.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnecting(false);
      
      // Join chat with doctor
      joinDoctorChat();
      
      // Add welcome message
      setMessages([
        {
          id: 'system-welcome',
          text: 'Connected to healthcare chat. Start a conversation with a doctor.',
          senderId: 'system',
          senderType: 'system',
          timestamp: new Date(),
          isRead: true,
        }
      ]);
    });

    // Handle previous messages
    socket.current.on('previousMessages', ({ chatId, messages: messageHistory }: { chatId: string; messages: Message[] }) => {
      if (messageHistory && messageHistory.length > 0) {
        setMessages(prevMessages => [
          ...prevMessages,
          ...messageHistory.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        ]);
        setIsConnected(true);
      }
    });

    // Handle incoming messages
    socket.current.on('message', ({ chatId, message: data }) => {
      // Convert timestamp to Date
      const newMessage = {
        ...data,
        timestamp: new Date(data.timestamp),
      };
      
      // Add message to chat
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setIsTyping(false);
      setIsConnected(true);
      
      // Mark message as read
      if (data.senderId !== patientId.current) {
        socket.current?.emit('markAsRead', {
          chatId: chatId.current,
          messageIds: [data.id],
        });
      }
    });

    // Handle typing indicator
    socket.current.on('typing', ({ chatId, userId, isTyping: typing }) => {
      if (userId !== patientId.current) {
        setIsTyping(typing);
      }
    });

    // Clean up on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Join chat with a doctor
  const joinDoctorChat = () => {
    socket.current?.emit('joinChat', {
      patientId: patientId.current,
      doctorId: doctorId.current,
    });
  };

  // Send a message
  const sendMessage = () => {
    if (!message.trim()) return;
    
    // Send to server
    socket.current?.emit('message', {
      text: message,
      chatId: chatId.current,
      timestamp: new Date(),
    });
    
    // Clear input
    setMessage('');
  };

  // Handle typing
  const handleTyping = (text: string) => {
    setMessage(text);
    
    // Send typing status to server
    socket.current?.emit('typing', {
      chatId: chatId.current,
      isTyping: text.length > 0,
    });
  };

  // Render message bubble
  const MessageBubble = ({ message }: { message: Message }) => {
    const isFromPatient = message.senderId === patientId.current;
    const isSystem = message.senderId === 'system';
    
    if (isSystem) {
      return (
        <View style={{ alignItems: 'center', margin: 12 }}>
          <Text style={{ color: '#6b7280', fontSize: 14, fontStyle: 'italic' }}>
            {message.text}
          </Text>
        </View>
      );
    }
    
    return (
      <View 
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginVertical: 4,
          maxWidth: '75%',
          borderRadius: 12,
          alignSelf: isFromPatient ? 'flex-end' : 'flex-start',
          backgroundColor: isFromPatient ? '#3b82f6' : '#e5e7eb',
        }}
      >
        <Text style={{ color: isFromPatient ? 'white' : 'black' }}>
          {message.text}
        </Text>
        <Text 
          style={{
            fontSize: 12,
            color: isFromPatient ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
            marginTop: 4,
          }}
        >
          {message.timestamp instanceof Date 
            ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.isRead && isFromPatient && ' ✓'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {isConnecting ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 16 }}>Connecting to chat...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Chat header */}
          <View style={{ padding: 12, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Healthcare Chat</Text>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>
              {isConnected ? 'Connected to a healthcare professional' : 'Waiting for a healthcare professional...'}
            </Text>
          </View>
          
          {/* Messages list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <MessageBubble message={item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 12, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1 }}
          />
          
          {/* Typing indicator */}
          {isTyping && (
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Doctor is typing...</Text>
            </View>
          )}
          
          {/* Message input */}
          <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
              value={message}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity
              style={{
                marginLeft: 8,
                backgroundColor: message.trim() ? '#3b82f6' : '#93c5fd',
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default PatientChat;