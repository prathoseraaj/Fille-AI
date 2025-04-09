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
  FlatListProps,
  ListRenderItem,
  TextInputProps,
  TouchableOpacityProps,
} from 'react-native';
import io, { Socket } from 'socket.io-client';

// Define types for all components
type Message = {
  id: string;
  text: string;
  isFromUser: boolean;
  timestamp: Date;
};

type MessageBubbleProps = {
  message: Message;
};

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
};

// Component for individual message bubbles
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => (
  <View 
    style={{
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginVertical: 4,
      maxWidth: '75%',
      borderRadius: 12,
      alignSelf: message.isFromUser ? 'flex-end' : 'flex-start',
      backgroundColor: message.isFromUser ? '#3b82f6' : '#e5e7eb',
    }}
  >
    <Text style={{ color: message.isFromUser ? 'white' : 'black' }}>
      {message.text}
    </Text>
    <Text 
      style={{
        fontSize: 12,
        color: message.isFromUser ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
        marginTop: 4,
      }}
    >
      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </View>
);

// Component for the chat input area
const ChatInput: React.FC<ChatInputProps> = ({ value, onChangeText, onSend, disabled }) => (
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
      value={value}
      onChangeText={onChangeText}
      placeholder="Type a message..."
      multiline
    />
    <TouchableOpacity
      style={{
        marginLeft: 8,
        backgroundColor: disabled ? '#93c5fd' : '#3b82f6',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={onSend}
      disabled={disabled}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>→</Text>
    </TouchableOpacity>
  </View>
);

const SimpleRealChat: React.FC = () => {
  // State
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Refs
  const socket = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList<Message> | null>(null);
  
  // Generate a random user ID for anonymous chat
  const userId = useRef<string>(`user_${Math.random().toString(36).substring(2, 9)}`);
  
  // Setup socket connection
  useEffect(() => {
    // Connect to your socket server
    socket.current = io('http://localhost:3000', {
      transports: ['websocket'],
      query: {
        userId: userId.current,
      }
    });

    // Handle connection
    socket.current.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnecting(false);
      
      // Add welcome message
      setMessages([
        {
          id: 'system-welcome',
          text: 'Connected to a healthcare professional. You can start chatting now.',
          isFromUser: false,
          timestamp: new Date(),
        }
      ]);
    });

    // Handle incoming messages
    socket.current.on('message', (data: {
      id?: string;
      text: string;
      userId: string;
      timestamp?: Date | string | number;
    }) => {
      const newMessage: Message = {
        id: data.id || Date.now().toString(),
        text: data.text,
        isFromUser: data.userId === userId.current,
        timestamp: new Date(data.timestamp || Date.now()),
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setIsTyping(false);
    });

    // Handle typing indicator
    socket.current.on('typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== userId.current) {
        setIsTyping(data.isTyping);
      }
    });

    // Clean up on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Send a message
  const sendMessage = () => {
    if (!message.trim()) return;
    
    // Create message object
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isFromUser: true,
      timestamp: new Date(),
    };
    
    // Add to local messages
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Send to server
    socket.current?.emit('message', {
      text: message,
      userId: userId.current,
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
      userId: userId.current,
      isTyping: text.length > 0,
    });
  };

  // Render a message
  const renderMessage: ListRenderItem<Message> = ({ item }) => (
    <MessageBubble message={item} />
  );

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
            <Text style={{ color: '#6b7280', fontSize: 14 }}>Chat with a healthcare professional</Text>
          </View>
          
          {/* Messages list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 12 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          
          {/* Typing indicator */}
          {isTyping && (
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Doctor is typing...</Text>
            </View>
          )}
          
          {/* Message input */}
          <ChatInput 
            value={message}
            onChangeText={handleTyping}
            onSend={sendMessage}
            disabled={!message.trim()}
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default SimpleRealChat;