import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  SafeAreaView,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { marked } from 'marked';
import highlightjs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import { useFonts } from 'expo-font';

// Register commonly used languages
highlightjs.registerLanguage('javascript', javascript);
highlightjs.registerLanguage('python', python);

const FilleAI = () => {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('./assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Bold': require('./assets/fonts/Outfit-Bold.ttf'),
  });

  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  
  // Animation values
  const welcomeOpacity = useRef(new Animated.Value(1)).current;
  const centerContentMargin = useRef(new Animated.Value(150)).current;

  // Function to handle input height changes
  const updateInputHeight = (height) => {
    const newHeight = Math.min(Math.max(40, height), 100);
    setInputHeight(newHeight);
  };

  // Function to format code blocks with custom renderer
  const formatMessage = (text) => {
    // Use the same marked configuration as in web version
    marked.setOptions({
      highlight: function(code, language) {
        if (language && highlightjs.getLanguage(language)) {
          return highlightjs.highlight(code, { language: language }).value;
        }
        return highlightjs.highlightAuto(code).value;
      }
    });
    
    return marked.parse(text);
  };

  // User Message Component
  const UserMessage = ({ text }) => (
    <View style={{ alignSelf: 'flex-end', maxWidth: '80%', marginVertical: 8 }}>
      <View style={{ 
        backgroundColor: '#24273A', 
        borderRadius: 15, 
        borderTopRightRadius: 5,
        padding: 12
      }}>
        <Text style={{ color: 'white', fontFamily: 'Outfit-Regular', fontSize: 16 }}>{text}</Text>
      </View>
    </View>
  );

  // Computer Message Component with Markdown support
  const ComputerMessage = ({ text }) => {
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopyCode = async (code, index) => {
      await Clipboard.setStringAsync(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    const markdownStyles = {
      body: {
        color: 'white',
        fontFamily: 'Outfit-Regular',
        fontSize: 16,
        lineHeight: 24,
      },
      heading1: {
        fontFamily: 'Outfit-Bold',
        fontSize: 22,
        marginTop: 8,
        marginBottom: 4,
        color: 'white',
      },
      heading2: {
        fontFamily: 'Outfit-Bold',
        fontSize: 20,
        marginTop: 8,
        marginBottom: 4,
        color: 'white',
      },
      heading3: {
        fontFamily: 'Outfit-Bold',
        fontSize: 18,
        marginTop: 8,
        marginBottom: 4,
        color: 'white',
      },
      link: {
        color: '#fff',
        textDecorationLine: 'underline',
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(255, 255, 255, 0.5)',
        paddingLeft: 10,
        fontStyle: 'italic',
      },
      code_block: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 10,
        borderRadius: 5,
        fontFamily: 'monospace',
        fontSize: 14,
      },
      code_inline: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 4,
        borderRadius: 3,
        fontFamily: 'monospace',
        fontSize: 14,
      },
      list_item: {
        marginBottom: 6,
      },
    };

    // Custom renderer for code blocks
    const renderCodeBlock = (props) => {
      const { content, language } = props;
      return (
        <View style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 6,
          overflow: 'hidden',
          marginVertical: 10,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              {language || 'code'}
            </Text>
            <TouchableOpacity 
              onPress={() => handleCopyCode(content, props.index)}
              style={{
                backgroundColor: 'transparent',
                padding: 4,
                borderRadius: 4,
              }}>
              <FontAwesome5 
                name={copiedIndex === props.index ? "check" : "copy"} 
                size={14} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={{
              fontFamily: 'monospace',
              padding: 12,
              color: 'white',
              fontSize: 14,
            }}>
              {content}
            </Text>
          </ScrollView>
        </View>
      );
    };

    return (
      <View style={{ alignSelf: 'flex-start', maxWidth: '80%', marginVertical: 8 }}>
        <View style={{ 
          backgroundColor: '#1A1C25', 
          borderRadius: 15, 
          borderTopLeftRadius: 5,
          padding: 12
        }}>
          <Markdown 
            style={markdownStyles}
            rules={{
              code_block: (node, children, parent, styles, renderContent) => {
                return renderCodeBlock({
                  content: node.content,
                  language: node.language,
                  index: node.key,
                });
              }
            }}
          >
            {text}
          </Markdown>
        </View>
      </View>
    );
  };

  // Loading indicator
  const LoadingIndicator = () => (
    <View style={{ alignSelf: 'flex-start', marginVertical: 8 }}>
      <View style={{ 
        backgroundColor: '#1A1C25', 
        borderRadius: 15, 
        borderTopLeftRadius: 5,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <View 
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'white',
              opacity: 0.4,
              marginHorizontal: 3,
            }}
          />
        ))}
      </View>
    </View>
  );

  // Handler for chat submit
  const handleSubmit = async () => {
    if (inputText.trim() === '' || isLoading) return;

    // Add user message to chat
    const userMessage = inputText.trim();
    setMessages(prevMessages => [...prevMessages, { type: 'user', text: userMessage }]);
    setInputText('');
    setInputHeight(40);

    // If this is the first message, transition the UI
    if (!isSearchSubmitted) {
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(centerContentMargin, {
          toValue: 20,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsSearchSubmitted(true);
      });
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Send request to server
      const response = await fetch("http://localhost:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to chat
      const aiResponse = typeof data.response === 'string' 
        ? data.response
        : JSON.stringify(data.response);
      
      setMessages(prevMessages => [...prevMessages, { type: 'computer', text: aiResponse }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { type: 'computer', text: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1C25' }}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1C25' }}>
        <StatusBar style="light" />
        
        {/* Navbar */}
        <View style={{ padding: 20 }}>
          <Text style={{ color: 'white', fontFamily: 'Outfit-Bold', fontSize: 17 }}>FILLE AI</Text>
        </View>
        
        {/* Main Content */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            {/* Center Content */}
            <Animated.View style={{ 
              flex: 1, 
              marginTop: centerContentMargin,
            }}>
              {/* Welcome Message */}
              {!isSearchSubmitted && (
                <Animated.View style={{ 
                  opacity: welcomeOpacity,
                  alignItems: 'center',
                }}>
                  <Text style={{ 
                    color: 'white', 
                    fontFamily: 'Outfit-Bold', 
                    fontSize: 24,
                    textAlign: 'center'
                  }}>
                    Hello, GIRL!
                  </Text>
                  <Text style={{ 
                    color: 'white', 
                    fontFamily: 'Outfit-Regular',
                    fontSize: 16,
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    Ready to share your problems and feelings today?
                  </Text>
                </Animated.View>
              )}

              {/* Conversation Container */}
              <ScrollView
                ref={scrollViewRef}
                style={{ 
                  display: isSearchSubmitted ? 'flex' : 'none',
                  paddingHorizontal: 16,
                }}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {messages.map((message, index) => (
                  message.type === 'user' ? (
                    <UserMessage key={index} text={message.text} />
                  ) : (
                    <ComputerMessage key={index} text={message.text} />
                  )
                ))}
                {isLoading && <LoadingIndicator />}
              </ScrollView>
            </Animated.View>

            {/* Input Container */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginHorizontal: 20, 
              marginBottom: 20,
              marginTop: 10,
              backgroundColor: '#24273A',
              borderRadius: 10,
              paddingHorizontal: 10,
            }}>
              <TextInput
                ref={inputRef}
                style={{
                  flex: 1,
                  color: 'white',
                  fontFamily: 'Outfit-Regular',
                  fontSize: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  minHeight: inputHeight,
                  maxHeight: 100,
                }}
                placeholder="What's my need !?"
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
                multiline
                onContentSizeChange={(e) => 
                  updateInputHeight(e.nativeEvent.contentSize.height)
                }
              />
              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={isLoading || inputText.trim() === ''}
                style={{ padding: 8, opacity: (isLoading || inputText.trim() === '') ? 0.5 : 1 }}
              >
                <FontAwesome5 name="arrow-circle-right" size={25} color="rgb(255, 123, 0)" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={{ paddingBottom: 10, alignItems: 'center' }}>
          <Text style={{ color: 'grey', fontSize: 12 }}>
            Fille AI is not infallible. Gasp! Cross-check significant information!
          </Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default FilleAI;