import React, { useState, useRef, useEffect } from 'react';
import "./global.css"
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
  KeyboardAvoidingView,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { marked } from 'marked';
import highlightjs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import { Link, router, useRouter, Stack } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

// Register commonly used languages
highlightjs.registerLanguage('javascript', javascript);
highlightjs.registerLanguage('python', python);

// Screen dimensions for responsive layouts
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Suggested questions for users
const SUGGESTED_QUESTIONS = [
  "What are common symptoms of PCOS?",
  "How can I manage menstrual pain naturally?",
  "What should I know before pregnancy planning?",
  "Is my period flow normal?",
  "Why am I experiencing fatigue during periods?"
];

const FilleAI = () => {
  const router = useRouter();
  
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ type: string; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [suggestedQuestions, setSuggestedQuestions] = useState(SUGGESTED_QUESTIONS);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Animation values
  const welcomeOpacity = useRef(new Animated.Value(1)).current;
  const centerContentMargin = useRef(new Animated.Value(150)).current;
  const floatingButtonScale = useRef(new Animated.Value(1)).current;
  const inputContainerAnimation = useRef(new Animated.Value(0)).current;
  
  // Pulse animation for suggestion bubbles
  useEffect(() => {
    const pulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingButtonScale, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingButtonScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (!isSearchSubmitted) {
      pulsate.start();
    } else {
      pulsate.stop();
    }
    
    return () => pulsate.stop();
  }, [isSearchSubmitted]);
  
  // Show input container animation
  useEffect(() => {
    Animated.timing(inputContainerAnimation, {
      toValue: 1,
      duration: 500,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Function to handle input height changes
  const updateInputHeight = (height: number) => {
    const newHeight = Math.min(Math.max(40, height), 100);
    setInputHeight(newHeight);
  };

  // Function to format code blocks with custom renderer
  const formatMessage = (text: string) => {
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

  // User Message Component with enhanced styling
  const UserMessage = ({ text }: { text: string }) => (
    <View style={{ 
      alignSelf: 'flex-end', 
      maxWidth: '80%', 
      marginVertical: 8,
      transform: [{ translateY: 0 }], // For animation preparation
    }}>
      <View style={{ 
        backgroundColor: '#FF7B00', 
        borderRadius: 18, 
        borderTopRightRadius: 4,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
      }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>{text}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4, marginRight: 4 }}>
        <Text style={{ color: '#AAAAAA', fontSize: 12, marginRight: 5 }}>You</Text>
        <View style={{ 
          width: 24, 
          height: 24, 
          borderRadius: 12, 
          backgroundColor: '#555', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <FontAwesome5 name="user" size={12} color="#FFF" />
        </View>
      </View>
    </View>
  );

  // Computer Message Component with Markdown support
  const ComputerMessage = ({ text }: { text: string }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopyCode = async (code: string, index: number) => {
      await Clipboard.setStringAsync(code);
      setCopiedIndex(index);
      
      // Add haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    const markdownStyles = {
      body: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
      },
      heading1: {
        fontWeight: 'bold',
        fontSize: 22,
        marginTop: 8,
        marginBottom: 4,
        color: 'white',
      },
      heading2: {
        fontWeight: 'bold',
        fontSize: 20,
        marginTop: 8,
        marginBottom: 4,
        color: 'white',
      },
      heading3: {
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: 8,
        marginBottom: 4,
        color: 'white',
      },
      link: {
        color: '#FF9D4F',
        textDecorationLine: "underline",
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: '#FF7B00',
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
    const renderCodeBlock = (props: { content: string; language?: string; index: number }) => {
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
      <View style={{ 
        alignSelf: 'flex-start', 
        maxWidth: '80%', 
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
      }}>
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 16, 
          backgroundColor: '#FF7B00', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: 8,
          marginBottom: 4,
        }}>
          <FontAwesome5 name="robot" size={16} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ 
            backgroundColor: '#332940', 
            borderRadius: 18, 
            borderBottomLeftRadius: 4,
            padding: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 2,
          }}>
            <Markdown 
              style={markdownStyles as any}
              rules={{
                code_block: (node, children, parent, styles, renderContent) => {
                  return renderCodeBlock({
                    content: node.content,
                    language: (node as any).language,
                    index: parseInt(node.key, 10),
                  });
                }
              }}
            >
              {text}
            </Markdown>
          </View>
          <Text style={{ color: '#AAAAAA', fontSize: 12, marginLeft: 4, marginTop: 4 }}>Fille AI</Text>
        </View>
      </View>
    );
  };

  // Enhanced Loading indicator with animation
  const LoadingIndicator = () => {
    const [dotIndex, setDotIndex] = useState(0);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setDotIndex(prev => (prev + 1) % 4);
      }, 300);
      return () => clearInterval(interval);
    }, []);
    
    return (
      <View style={{ 
        alignSelf: 'flex-start', 
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
      }}>
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 16, 
          backgroundColor: '#FF7B00', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: 8,
          marginBottom: 4,
        }}>
          <FontAwesome5 name="robot" size={16} color="#FFF" />
        </View>
        <View style={{ 
          backgroundColor: '#332940', 
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 2,
        }}>
          {[0, 1, 2].map((i) => (
            <View 
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: 'white',
                opacity: dotIndex === i ? 0.9 : 0.4,
                marginHorizontal: 4,
                transform: [{ 
                  translateY: dotIndex === i ? -4 : 0 
                }]
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  // Suggestion bubble component
  const SuggestionBubble = ({ text }: { text: string }) => (
    <Animated.View style={{
      transform: [{ scale: floatingButtonScale }]
    }}>
      <TouchableOpacity
        style={{
          backgroundColor: 'rgba(255, 123, 0, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(255, 123, 0, 0.3)',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginRight: 10,
          marginBottom: 10,
          shadowColor: "#FF7B00",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 2,
        }}
        onPress={() => {
          // Add haptic feedback
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setInputText(text);
          handleSubmit(text);
        }}
      >
        <Text style={{ color: '#FF9D4F', fontSize: 14 }}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Get server URL based on environment
  const getServerUrl = () => {
    if (Platform.OS === 'android') {
      // Special IP that Android emulator uses to access host machine
      return "http://10.0.2.2:8000/chat";
    } else if (Platform.OS === 'ios') {
      return "http://localhost:8000/chat";
    } else {
      // For web or other platforms
      return "http://localhost:8000/chat";
    }
  };

  // Handler for chat submit
  const handleSubmit = async (text = inputText) => {
    const messageToSend = text.trim();
    if (messageToSend === '' || isLoading) return;

    // Add haptic feedback on send
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Add user message to chat
    const userMessage = messageToSend;
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
      const serverUrl = getServerUrl();
      console.log(`Sending request to: ${serverUrl}`);
      
      // Send request to server
      const response = await fetch(serverUrl, {
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
      
      // Add haptic feedback when response arrives
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setMessages(prevMessages => [...prevMessages, { type: 'computer', text: aiResponse }]);
      
      // Update suggested questions based on conversation context
      updateSuggestedQuestions(userMessage, aiResponse);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Add haptic feedback for error
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert(
        "Connection Error",
        `Failed to connect to server: ${(error as Error).message}\n\nMake sure your server is running and the device can reach it.`,
        [{ text: "OK" }]
      );
      
      setMessages(prevMessages => [
        ...prevMessages,
        { type: 'computer', text: 'Sorry, there was an error processing your request. Please check your network connection and make sure the server is running.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update suggested questions based on conversation
  const updateSuggestedQuestions = (userMessage: string, aiResponse: string) => {
    // This is a simplified approach. For production, you might want to use the AI to generate these.
    const periodRelated = userMessage.toLowerCase().includes('period') || 
                          aiResponse.toLowerCase().includes('period');
    
    const painRelated = userMessage.toLowerCase().includes('pain') || 
                        aiResponse.toLowerCase().includes('pain');
    
    const pregnancyRelated = userMessage.toLowerCase().includes('pregnan') || 
                             aiResponse.toLowerCase().includes('pregnan');
    
    const hormoneRelated = userMessage.toLowerCase().includes('hormone') || 
                           aiResponse.toLowerCase().includes('hormone');
    
    let newSuggestions = [...SUGGESTED_QUESTIONS];
    
    if (periodRelated) {
      newSuggestions = [
        "What causes irregular periods?",
        "How can I track my menstrual cycle?",
        "When should I be concerned about heavy flow?",
      ];
    } else if (painRelated) {
      newSuggestions = [
        "What are natural remedies for cramps?",
        "Should I see a doctor about period pain?",
        "How can exercise help with menstrual pain?",
      ];
    } else if (pregnancyRelated) {
      newSuggestions = [
        "What prenatal vitamins should I take?",
        "How does ovulation tracking work?",
        "What are early signs of pregnancy?",
      ];
    } else if (hormoneRelated) {
      newSuggestions = [
        "How do hormones affect mood?",
        "What foods help balance hormones?",
        "How does stress impact hormonal health?",
      ];
    }
    
    // Shuffle the array to get different suggestions each time
    newSuggestions.sort(() => Math.random() - 0.5);
    
    // Take only the first 3
    setSuggestedQuestions(newSuggestions.slice(0, 3));
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages]);

  return (
    <>
      {/* Add Stack.Screen options to hide the header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1C25' }}>
          <StatusBar style="light" />
          
          {/* Navbar */}
          <View style={{ 
            padding: 20, 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome5 name="heartbeat" size={18} color="#FF7B00" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                FILLE <Text style={{ color: '#FF7B00' }}>AI</Text>
              </Text>
            </View>
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#332940', 
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push("/realchat");
              }}
            >
              <MaterialCommunityIcons name="doctor" size={16} color="#FF9D4F" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FF9D4F', fontSize: 13 }}>Talk to Doctor</Text>
            </TouchableOpacity>
          </View>
          
          {/* Main Content */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                    padding: 20,
                  }}>
                    <View style={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: 50, 
                      backgroundColor: '#FF7B00',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 20,
                      shadowColor: "#FF7B00",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 20,
                    }}>
                      <FontAwesome5 name="female" size={50} color="white" />
                    </View>
                    <Text style={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      fontSize: 28,
                      textAlign: 'center'
                    }}>
                      Hello, GIRL!
                    </Text>
                    <Text style={{ 
                      color: '#AAAAAA', 
                      fontSize: 16,
                      marginTop: 12,
                      textAlign: 'center',
                      paddingHorizontal: 30,
                      lineHeight: 22
                    }}>
                      I'm your health companion. Ready to share your problems and feelings today?
                    </Text>
                    
                    {/* Suggested Topics */}
                    <Text style={{ color: 'white', marginTop: 30, marginBottom: 15, fontWeight: '600' }}>
                      Try asking about:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {suggestedQuestions.map((question, index) => (
                        <SuggestionBubble key={index} text={question} />
                      ))}
                    </View>
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
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((message, index) => (
                    (message as { type: string; text: string }).type === 'user' ? (
                      <UserMessage key={index} text={(message as { type: string; text: string }).text} />
                    ) : (
                      <ComputerMessage key={index} text={(message as { type: string; text: string }).text} />
                    )
                  ))}
                  {isLoading && <LoadingIndicator />}
                </ScrollView>
              </Animated.View>

              {/* Suggestions row (visible only after first message) */}
              {isSearchSubmitted && !isLoading && messages.length > 0 && (
                <View style={{ 
                  paddingHorizontal: 20, 
                  paddingVertical: 10 
                }}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ flexDirection: 'row' }}
                    contentContainerStyle={{ paddingRight: 20 }}
                  >
                    {suggestedQuestions.map((question, index) => (
                      <SuggestionBubble key={index} text={question} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Input Container */}
              <Animated.View style={{ 
                flexDirection: 'row', 
                alignItems: 'flex-end',
                marginHorizontal: 20, 
                marginBottom: 20,
                marginTop: 10,
                backgroundColor: '#24273A',
                borderRadius: 25,
                paddingHorizontal: 10,
                paddingVertical: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                elevation: 5,
                opacity: inputContainerAnimation,
                transform: [{ 
                  translateY: inputContainerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  }) 
                }]
              }}>
                <TextInput
                  ref={inputRef}
                  style={{
                    flex: 1,
                    color: 'white',
                    fontSize: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    minHeight: inputHeight,
                    maxHeight: 100,
                  }}
                  placeholder="Ask me anything about women's health"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  onContentSizeChange={(e) => 
                    updateInputHeight(e.nativeEvent.contentSize.height)
                  }
                />
                <TouchableOpacity 
                  onPress={() => handleSubmit()}
                  disabled={isLoading || inputText.trim() === ''}
                  style={{ 
                    padding: 10, 
                    backgroundColor: (isLoading || inputText.trim() === '') ? '#444' : '#FF7B00',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Ionicons name="send" size={18} color="white" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>

          {/* Footer */}
          <View style={{ 
            paddingBottom: 10, 
            alignItems: 'center', 
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
            paddingTop: 10
          }}>
            <Text style={{ color: 'grey', fontSize: 12 }}>
              For informational purposes. Consult a healthcare professional.
            </Text>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  );
};

export default FilleAI;
