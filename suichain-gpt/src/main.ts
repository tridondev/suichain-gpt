import './style.css';




// Types and Interfaces
interface NavItem {
  id: string;
  label: string;
  icon: string;
  view: string;
  badge?: string;
}

interface StakingOption {
  rank: number;
  name: string;
  type: string;
  apy: string;
  risk: 'low' | 'medium' | 'high';
  color: string;
  tvl?: string;
  description?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type?: 'text' | 'chart' | 'table';
}

interface SimulationParams {
  amount: number;
  timeframe: string;
  strategy: string;
  compounding: boolean;
}

interface SimulationResult {
  initialAmount: number;
  finalAmount: number;
  profit: number;
  roi: number;
  monthlyBreakdown: Array<{
    month: string;
    balance: number;
    earnings: number;
  }>;
}

interface MarketData {
  suiPrice: number;
  suiPriceChange24h: number;
  totalTVL: string;
  topGainers: Array<{
    token: string;
    change: number;
  }>;
}

// State Management
class AppState {
  private listeners: Map<string, Set<Function>> = new Map();
  private state: any = {
    currentView: 'assistant',
    walletConnected: false,
    userAddress: null,
    marketData: null,
    chatHistory: [],
    simulationResults: null,
    portfolioData: null,
    loading: false,
    theme: 'dark'
  };

  subscribe(key: string, callback: Function): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  update(key: string, value: any): void {
    this.state[key] = value;
    this.listeners.get(key)?.forEach(callback => callback(value));
  }

  get(key: string): any {
    return this.state[key];
  }
}

// Components
class AIAssistant {
  private appState: AppState;
  private chatContainer: HTMLElement | null = null;

  constructor(appState: AppState) {
    this.appState = appState;
  }

  render(): string {
    const chatHistory = this.appState.get('chatHistory') || [];
    
    return `
      <div class="max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            ${this.renderChatSection(chatHistory)}
          </div>
          <div>
            ${this.renderQuickActions()}
            ${this.renderSuggestions()}
          </div>
        </div>
      </div>
    `;
  }

  private renderChatSection(chatHistory: ChatMessage[]): string {
    return `
      <div class="card p-6 h-[700px] flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">AI DeFi Assistant</h3>
          <button class="text-slate-400 hover:text-white transition-colors" id="clear-chat">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        <div class="flex-grow overflow-auto mb-4 space-y-4" id="chat-messages">
          ${this.renderWelcomeMessage()}
          ${chatHistory.map(msg => this.renderMessage(msg)).join('')}
        </div>
        
        ${this.renderChatInput()}
      </div>
    `;
  }

  private renderWelcomeMessage(): string {
    return `
      <div class="chat-bubble ai-bubble">
        <div class="flex items-start">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p class="font-medium mb-1">SuiChain AI</p>
            <p>Welcome! I'm your DeFi strategy advisor on Sui blockchain. I can help you:</p>
            <ul class="mt-2 space-y-1 text-sm">
              <li>• Find the best staking and yield opportunities</li>
              <li>• Simulate DeFi strategies and calculate returns</li>
              <li>• Assess risks and optimize your portfolio</li>
              <li>• Learn about Sui protocols and DeFi concepts</li>
            </ul>
            <p class="mt-2">How can I assist you today?</p>
          </div>
        </div>
      </div>
    `;
  }

  private renderMessage(message: ChatMessage): string {
    const isUser = message.sender === 'user';
    return `
      <div class="chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}">
        ${!isUser ? `
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p class="font-medium mb-1">SuiChain AI</p>
              <div>${message.content}</div>
            </div>
          </div>
        ` : message.content}
      </div>
    `;
  }

  private renderChatInput(): string {
    return `
      <div class="border-t border-slate-700 pt-4">
        <div class="flex">
          <input 
            type="text" 
            id="chat-input"
            placeholder="Ask about DeFi strategies, yield farming, risks..." 
            class="flex-grow px-4 py-3 bg-slate-800 text-white rounded-l-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
          <button id="send-message" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-r-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        
        <div class="flex mt-3 text-xs text-slate-400">
          <button class="mr-3 hover:text-blue-400 transition-colors quick-action-btn" data-action="simulate">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Simulate yield
          </button>
          <button class="mr-3 hover:text-blue-400 transition-colors quick-action-btn" data-action="compare">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Compare protocols
          </button>
          <button class="hover:text-blue-400 transition-colors quick-action-btn" data-action="risk">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Risk assessment
          </button>
        </div>
      </div>
    `;
  }

  private renderQuickActions(): string {
    return `
      <div class="card p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
        <div class="space-y-3">
          <button class="quick-action w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg text-left transition-all">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium">Stake SUI</p>
                <p class="text-xs text-slate-400">Earn 8-12% APY</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          
          <button class="quick-action w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg text-left transition-all">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium">Provide Liquidity</p>
                <p class="text-xs text-slate-400">Earn trading fees</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          
          <button class="quick-action w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg text-left transition-all">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium">Yield Farming</p>
                <p class="text-xs text-slate-400">Maximize returns</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  private renderSuggestions(): string {
    return `
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4 text-white">Suggested Questions</h3>
        <div class="space-y-2">
          <button class="suggestion-btn w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
            "What's the best way to earn passive income with 1000 SUI?"
          </button>
          <button class="suggestion-btn w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
            "Compare Cetus and Turbos liquidity pools"
          </button>
          <button class="suggestion-btn w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
            "Explain impermanent loss in simple terms"
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners(): void {
    // Chat input and send button
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendButton = document.getElementById('send-message');

    if (chatInput && sendButton) {
      const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
          this.sendMessage(message);
          chatInput.value = '';
        }
      };

      sendButton.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.handleQuickAction(action!);
      });
    });

    // Suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const question = (e.currentTarget as HTMLElement).textContent?.trim();
        if (question) {
          this.sendMessage(question);
        }
      });
    });

    // Clear chat button
    const clearButton = document.getElementById('clear-chat');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.appState.update('chatHistory', []);
        this.render();
      });
    }
  }

  private sendMessage(message: string): void {
    const chatHistory = this.appState.get('chatHistory') || [];
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    chatHistory.push(userMessage);
    this.appState.update('chatHistory', chatHistory);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = this.generateAIResponse(message);
      chatHistory.push(aiResponse);
      this.appState.update('chatHistory', chatHistory);
      this.scrollToBottom();
    }, 1000);

    this.scrollToBottom();
  }

  private generateAIResponse(userMessage: string): ChatMessage {
    // Simple response logic - in real app, this would call an AI service
    let content = '';

    if (userMessage.toLowerCase().includes('stake') || userMessage.toLowerCase().includes('staking')) {
      content = `
        <p>Here are the top staking options for SUI tokens:</p>
        <div class="mt-3 space-y-3">
          <div class="bg-slate-700 p-3 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-white">Suistake Protocol</p>
                <p class="text-xs text-slate-400">Validator staking</p>
              </div>
              <div class="text-right">
                <p class="text-green-400 font-bold">8.2% APY</p>
                <p class="text-xs text-slate-400">Low risk</p>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-3">Would you like me to simulate your staking returns?</p>
      `;
    } else if (userMessage.toLowerCase().includes('liquidity')) {
      content = `
        <p>Liquidity provision on Sui offers these opportunities:</p>
        <ul class="mt-2 space-y-1">
          <li>• Cetus Finance: 12-18% APR on major pairs</li>
          <li>• Turbos Finance: 10-15% APR + trading fees</li>
          <li>• Aftermath Finance: 8-12% APR with lower IL risk</li>
        </ul>
        <p class="mt-3">Remember to consider impermanent loss when providing liquidity!</p>
      `;
    } else {
      content = `
        <p>I understand you're asking about "${userMessage}". Let me help you with that.</p>
        <p class="mt-2">Based on current market conditions, I recommend exploring:</p>
        <ul class="mt-2 space-y-1">
          <li>• Staking options with 8-12% APY</li>
          <li>• Liquidity pools with balanced risk/reward</li>
          <li>• Yield farming strategies for higher returns</li>
        </ul>
        <p class="mt-3">Would you like specific recommendations?</p>
      `;
    }

    return {
      id: Date.now().toString(),
      sender: 'ai',
      content,
      timestamp: new Date()
    };
  }

  private handleQuickAction(action: string): void {
    switch (action) {
      case 'simulate':
        this.appState.update('currentView', 'simulator');
        break;
      case 'compare':
        this.sendMessage('Compare the top DeFi protocols on Sui');
        break;
      case 'risk':
        this.appState.update('currentView', 'risk');
        break;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }
}


// Main App Class
class SuichainApp {
  private appState: AppState;
  private components: Map<string, any> = new Map();
  
  private navItems: NavItem[] = [
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      view: 'assistant',
      badge: 'New'
    },
    {
      id: 'simulator',
      label: 'Strategy Simulator',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      view: 'simulator'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      view: 'portfolio'
    },
    {
      id: 'market',
      label: 'Market Data',
      icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      view: 'market'
    },
    {
      id: 'learn',
      label: 'Learn DeFi',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      view: 'learn'
    }
  ];

  constructor() {
    this.appState = new AppState();
    this.init();
  }

  private async init(): Promise<void> {
    // Initialize components
  
    this.components.set('aiAssistant', new AIAssistant(this.appState));
    
    // Setup state subscriptions
    this.appState.subscribe('currentView', () => this.render());
    this.appState.subscribe('walletConnected', () => this.render());
    this.appState.subscribe('chatHistory', () => this.render());
    
    // Initialize market data
    this.fetchMarketData();
    
    // Render initial view
    this.render();
    
    // Attach global event listeners
    this.attachEventListeners();
  }

  private render(): void {
    
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        ${this.renderHeader()}
        <div class="flex-grow flex">
          ${this.renderSidebar()}
          ${this.renderMainContent()}
        </div>
        ${this.renderNotifications()}
      </div>
    `;

    // Re-attach component event listeners after render
    this.components.forEach(component => {
      if (component.attachEventListeners) {
        component.attachEventListeners();
      }
    });
  }

  private renderHeader(): string {
    const walletConnected = this.appState.get('walletConnected');
    const marketData = this.appState.get('marketData');
    
    return `
      <header class="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center">
            <div class="gradient-bg p-2 rounded-lg mr-3 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-white">SuiChain AI</h1>
              <p class="text-xs text-slate-400">Smart DeFi Assistant</p>
            </div>
          </div>
          
          ${marketData ? `
            <div class="hidden lg:flex items-center space-x-6">
              <div class="text-sm">
                <span class="text-slate-400">SUI Price:</span>
                <span class="text-white font-semibold ml-1">$${marketData.suiPrice}</span>
                <span class="${marketData.suiPriceChange24h >= 0 ? 'text-green-400' : 'text-red-400'} ml-1 text-xs">
                  ${marketData.suiPriceChange24h >= 0 ? '+' : ''}${marketData.suiPriceChange24h}%
                </span>
              </div>
              <div class="text-sm">
                <span class="text-slate-400">TVL:</span>
                <span class="text-white font-semibold ml-1">${marketData.totalTVL}</span>
              </div>
            </div>
          ` : ''}
          
          <div class="flex items-center space-x-3">
            <button class="p-2 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            <button id="connect-wallet" class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>${walletConnected ? 'Connected' : 'Connect Wallet'}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  private renderSidebar(): string {
    const currentView = this.appState.get('currentView');
    
    return `
      <div class="w-64 bg-slate-900/50 backdrop-blur-lg border-r border-slate-700/50 hidden md:block">
        <div class="p-4">
          <nav>
            <ul class="space-y-2">
              ${this.navItems.map(item => `
                <li>
                  <a href="#" 
                     class="nav-link group flex items-center p-3 rounded-lg transition-all ${
                       currentView === item.view 
                       ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                       : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                     }"
                     data-view="${item.view}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 ${
                      currentView === item.view ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
                    </svg>
                    <span class="flex-grow">${item.label}</span>
                    ${item.badge ? `
                      <span class="ml-auto text-xs px-2 py-1 rounded-full ${
                        item.badge === 'New' ? 'bg-green-500 text-white' : 'bg-slate-600 text-white'
                      }">${item.badge}</span>
                    ` : ''}
                  </a>
                </li>
              `).join('')}
            </ul>
          </nav>
          
          <div class="mt-8 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
            <h4 class="text-sm font-semibold text-white mb-2">🚀 Pro Tip</h4>
            <p class="text-xs text-slate-300">
              Use our AI to analyze yield farming strategies before committing funds.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private renderMainContent(): string {
    const currentView = this.appState.get('currentView');
    
    return `
      <div class="flex-grow flex flex-col bg-slate-950/50">
        ${this.renderBreadcrumbs()}
        <div class="flex-grow p-6 overflow-auto">
          <div class="fade-in">
            ${this.renderView(currentView)}
          </div>
        </div>
      </div>
    `;
  }

  private renderBreadcrumbs(): string {
    const currentView = this.appState.get('currentView');
    const navItem = this.navItems.find(item => item.view === currentView);
    
    return `
      <div class="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 px-6 py-3">
        <div class="flex items-center text-sm">
          <span class="text-slate-400">Home</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-white font-medium">${navItem?.label || ''}</span>
        </div>
      </div>
    `;
  }

private renderView(view: string): string {
  switch (view) {
    case 'assistant': {
      const aiAssistant = this.components.get('aiAssistant');
      return aiAssistant ? aiAssistant.render() : '<div class="text-red-500">AI Assistant component not found.</div>';
    }
    case 'simulator':
      return this.renderSimulatorView();
    case 'portfolio':
      return this.renderPortfolioView();
    case 'market':
      return this.renderMarketView();
    case 'learn':
      return this.renderLearnView();
    default:
      console.warn(`Unknown view: ${view}. Falling back to dashboard.`);
      return this.renderDashboard();
  }
}


  private renderDashboard(): string {
    return `
      <div class="space-y-6">
        <div class="text-center py-12">
          <h2 class="text-3xl font-bold text-white mb-4">Welcome to SuiChain AI</h2>
          <p class="text-lg text-slate-400 mb-8">Your intelligent DeFi assistant on the Sui blockchain</p>
          
          <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div class="card p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">AI Assistant</h3>
              <p class="text-sm text-slate-400">Get personalized DeFi strategies and answers</p>
            </div>
            
            <div class="card p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">Strategy Simulator</h3>
              <p class="text-sm text-slate-400">Test and optimize your yield strategies</p>
            </div>
            
            <div class="card p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">Portfolio Tracker</h3>
              <p class="text-sm text-slate-400">Monitor your DeFi positions in real-time</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderSimulatorView(): string {
    const simulationResults = this.appState.get('simulationResults');
    
    return `
      <div class="max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div class="card p-6">
              <h2 class="text-2xl font-bold text-white mb-6">Strategy Simulator</h2>
              
              <div class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-slate-300 mb-2">Investment Amount (SUI)</label>
                    <div class="relative">
                      <input 
                        type="number" 
                        id="investment-amount"
                        placeholder="1000" 
                        class="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none pl-12"
                      />
                      <div class="absolute left-3 top-3 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
                    <select id="timeframe" class="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none">
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Select Strategy</label>
                  <div class="space-y-3">
                    ${this.getStakingOptions().map(option => `
                      <label class="flex items-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer transition-all border border-slate-700 hover:border-blue-500">
                        <input type="radio" name="strategy" value="${option.name}" class="mr-3 text-blue-600" />
                        <div class="flex-grow">
                          <div class="flex items-center">
                            <p class="font-medium text-white">${option.name}</p>
                            <span class="ml-2 text-xs px-2 py-1 rounded-full ${
                              option.risk === 'low' ? 'bg-green-500/20 text-green-400' :
                              option.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }">
                              ${option.risk} risk
                            </span>
                          </div>
                          <p class="text-sm text-slate-400 mt-1">${option.type} • ${option.tvl} TVL</p>
                        </div>
                        <div class="text-right">
                          <p class="text-green-400 font-bold text-lg">${option.apy}</p>
                          <p class="text-xs text-slate-400">APY</p>
                        </div>
                      </label>
                    `).join('')}
                  </div>
                </div>
                
                <div class="flex items-center">
                  <input type="checkbox" id="auto-compound" class="mr-2 text-blue-600" />
                  <label for="auto-compound" class="text-sm text-slate-300">Enable auto-compounding</label>
                </div>
                
                <button id="run-simulation" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all transform hover:scale-105">
                  Run Simulation
                </button>
              </div>
            </div>
          </div>
          
          <div>
            ${simulationResults ? this.renderSimulationResults(simulationResults) : this.renderSimulatorInfo()}
          </div>
        </div>
      </div>
    `;
  }

  private renderSimulatorInfo(): string {
    return `
      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Simulation Info</h3>
          <div class="space-y-3 text-sm text-slate-300">
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Simulations include protocol fees and gas costs</p>
            </div>
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>APY rates are based on 7-day averages</p>
            </div>
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Past performance doesn't guarantee future results</p>
            </div>
          </div>
        </div>
        
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Risk Factors</h3>
          <div class="space-y-3">
            <div class="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <p class="text-sm text-red-400 font-medium">High Risk</p>
              <p class="text-xs text-slate-300 mt-1">Potential for significant losses</p>
            </div>
            <div class="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <p class="text-sm text-yellow-400 font-medium">Medium Risk</p>
              <p class="text-xs text-slate-300 mt-1">Moderate volatility expected</p>
            </div>
            <div class="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p class="text-sm text-green-400 font-medium">Low Risk</p>
              <p class="text-xs text-slate-300 mt-1">Relatively stable returns</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderSimulationResults(results: SimulationResult): string {
    const roi = ((results.finalAmount - results.initialAmount) / results.initialAmount * 100).toFixed(2);
    
    return `
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Simulation Results</h3>
        
        <div class="space-y-4">
          <div class="text-center py-6">
            <p class="text-sm text-slate-400 mb-2">Estimated Final Value</p>
            <p class="text-4xl font-bold text-white">${results.finalAmount.toFixed(2)} SUI</p>
            <p class="text-lg text-green-400 mt-2">+${results.profit.toFixed(2)} SUI (${roi}%)</p>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Initial Investment</span>
              <span class="text-white">${results.initialAmount} SUI</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Total Earnings</span>
              <span class="text-green-400">+${results.profit.toFixed(2)} SUI</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">ROI</span>
              <span class="text-green-400">${roi}%</span>
            </div>
          </div>
          
          <div class="pt-4 border-t border-slate-700">
            <p class="text-sm font-medium text-white mb-3">Monthly Breakdown</p>
            <div class="space-y-2">
              ${results.monthlyBreakdown.map(month => `
                <div class="flex justify-between text-sm">
                  <span class="text-slate-400">${month.month}</span>
                  <span class="text-white">${month.balance.toFixed(2)} SUI</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <button class="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors mt-4">
            Export Results
          </button>
        </div>
      </div>
    `;
  }

  private renderPortfolioView(): string {
    const walletConnected = this.appState.get('walletConnected');
    
    if (!walletConnected) {
      return this.renderConnectWalletPrompt();
    }
    
    return `
      <div class="space-y-6">
        <div class="grid md:grid-cols-4 gap-4">
          ${this.renderPortfolioCard('Total Value', '$12,456.78', '+12.5%', 'green')}
          ${this.renderPortfolioCard('Total Profit', '$1,234.56', '+10.2%', 'green')}
          ${this.renderPortfolioCard('Active Positions', '5', '', 'blue')}
          ${this.renderPortfolioCard('Avg. APY', '15.8%', '', 'purple')}
        </div>
        
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Active Positions</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-slate-400 border-b border-slate-700">
                  <th class="pb-3">Protocol</th>
                  <th class="pb-3">Type</th>
                  <th class="pb-3">Amount</th>
                  <th class="pb-3">Value</th>
                  <th class="pb-3">APY</th>
                  <th class="pb-3">Profit</th>
                  <th class="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-800">
                  <td class="py-3 text-white">Cetus Finance</td>
                  <td class="py-3 text-slate-300">Liquidity Pool</td>
                  <td class="py-3 text-slate-300">1,000 SUI</td>
                  <td class="py-3 text-white">$3,456.78</td>
                  <td class="py-3 text-green-400">12.5%</td>
                  <td class="py-3 text-green-400">+$234.56</td>
                  <td class="py-3">
                    <button class="text-blue-400 hover:text-blue-300">Manage</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  private renderConnectWalletPrompt(): string {
    return `
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p class="text-slate-400 mb-6">Connect your wallet to view your DeFi portfolio</p>
          <button id="connect-wallet-prompt" class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105">
            Connect Wallet
          </button>
        </div>
      </div>
    `;
  }

  private renderPortfolioCard(title: string, value: string, change: string, color: string): string {
    return `
      <div class="card p-6">
        <p class="text-sm text-slate-400 mb-2">${title}</p>
        <p class="text-2xl font-bold text-white">${value}</p>
        ${change ? `
          <p class="text-sm ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'} mt-1">
            ${change}
          </p>
        ` : ''}
      </div>
    `;
  }

  private renderMarketView(): string {
  const marketData = this.appState.get('marketData') || {
    chartData: [
      { date: '05/01', price: 1.24, volume: 87, tps: 1243 },
      { date: '05/02', price: 1.32, volume: 92, tps: 1358 },
      { date: '05/03', price: 1.41, volume: 110, tps: 1402 },
      { date: '05/04', price: 1.38, volume: 105, tps: 1289 },
      { date: '05/05', price: 1.45, volume: 125, tps: 1512 },
      { date: '05/06', price: 1.52, volume: 142, tps: 1623 },
      { date: '05/07', price: 1.68, volume: 168, tps: 1745 },
      { date: '05/08', price: 1.72, volume: 172, tps: 1802 },
      { date: '05/09', price: 1.79, volume: 185, tps: 1956 },
      { date: '05/10', price: 1.83, volume: 190, tps: 2103 },
      { date: '05/11', price: 1.91, volume: 210, tps: 2254 },
      { date: '05/12', price: 2.05, volume: 240, tps: 2387 },
      { date: '05/13', price: 2.21, volume: 285, tps: 2512 },
      { date: '05/14', price: 2.35, volume: 310, tps: 2645 },
    ],
    topGainers: [
      { token: 'SUI', change: 15.6 },
      { token: 'CETUS', change: 12.8 },
      { token: 'SUISWAP', change: 9.3 },
      { token: 'TURBOS', change: 7.2 },
      { token: 'SCALLOP', change: -2.1 }
    ]
  };
  
  // Create the chart script - this will be injected at the end of the body
  const chartScript = `
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        // Reference to the chart container
        const chartContainer = document.getElementById('sui-chart-container');
        const priceButton = document.getElementById('price-btn');
        const volumeButton = document.getElementById('volume-btn');
        const tpsButton = document.getElementById('tps-btn');
        
        // Chart data
        const chartData = ${JSON.stringify(marketData.chartData)};
        
        // Chart configuration
        let chart;
        const chartConfig = {
          type: 'line',
          data: {
            labels: chartData.map(item => item.date),
            datasets: [{
              label: 'SUI Price ($)',
              data: chartData.map(item => item.price),
              borderColor: 'rgb(14, 165, 233)',
              backgroundColor: 'rgba(14, 165, 233, 0.2)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#F9FAFB',
                bodyColor: '#F9FAFB',
                borderColor: '#374151',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    let value = context.raw;
                    return typeof value === 'number' ? '$' + value.toFixed(2) : value;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: 'rgba(55, 65, 81, 0.3)',
                },
                ticks: {
                  color: '#9CA3AF',
                }
              },
              y: {
                grid: {
                  color: 'rgba(55, 65, 81, 0.3)',
                  drawBorder: false,
                },
                ticks: {
                  color: '#9CA3AF',
                  callback: function(value) {
                    return '$' + value;
                  }
                }
              }
            }
          }
        };
        
        // Create the chart
        chart = new Chart(
          document.getElementById('sui-chart'),
          chartConfig
        );
        
        // Set up button event listeners
        priceButton.addEventListener('click', () => {
          switchToDataset('price', 'SUI Price ($)', 'rgb(14, 165, 233)', 'rgba(14, 165, 233, 0.2)', '$');
          priceButton.classList.add('bg-blue-600', 'text-white');
          priceButton.classList.remove('bg-slate-800', 'text-slate-300');
          volumeButton.classList.add('bg-slate-800', 'text-slate-300');
          volumeButton.classList.remove('bg-blue-600', 'text-white');
          tpsButton.classList.add('bg-slate-800', 'text-slate-300');
          tpsButton.classList.remove('bg-blue-600', 'text-white');
        });
        
        volumeButton.addEventListener('click', () => {
          switchToDataset('volume', 'Volume (millions)', 'rgb(139, 92, 246)', 'rgba(139, 92, 246, 0.2)', '');
          volumeButton.classList.add('bg-blue-600', 'text-white');
          volumeButton.classList.remove('bg-slate-800', 'text-slate-300');
          priceButton.classList.add('bg-slate-800', 'text-slate-300');
          priceButton.classList.remove('bg-blue-600', 'text-white');
          tpsButton.classList.add('bg-slate-800', 'text-slate-300');
          tpsButton.classList.remove('bg-blue-600', 'text-white');
        });
        
        tpsButton.addEventListener('click', () => {
          switchToDataset('tps', 'Transactions per second', 'rgb(16, 185, 129)', 'rgba(16, 185, 129, 0.1)', '');
          tpsButton.classList.add('bg-blue-600', 'text-white');
          tpsButton.classList.remove('bg-slate-800', 'text-slate-300');
          priceButton.classList.add('bg-slate-800', 'text-slate-300');
          priceButton.classList.remove('bg-blue-600', 'text-white');
          volumeButton.classList.add('bg-slate-800', 'text-slate-300');
          volumeButton.classList.remove('bg-blue-600', 'text-white');
        });
        
        function switchToDataset(metric, label, borderColor, backgroundColor, prefix) {
          chart.data.datasets[0].data = chartData.map(item => item[metric]);
          chart.data.datasets[0].label = label;
          chart.data.datasets[0].borderColor = borderColor;
          chart.data.datasets[0].backgroundColor = backgroundColor;
          
          chart.options.plugins.tooltip.callbacks.label = function(context) {
            let value = context.raw;
            return typeof value === 'number' ? prefix + value.toFixed(metric === 'price' ? 2 : 0) : value;
          };
          
          chart.options.scales.y.ticks.callback = function(value) {
            return prefix + value;
          };
          
          chart.update();
        }
      });
    </script>
  `;
  
  // Create the HTML for the market view
  return `
    <div class="space-y-6">
      <div class="grid md:grid-cols-3 gap-6">
        <div class="col-span-2">
          <div class="card p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-white">Sui Network Metrics</h3>
              <div class="flex space-x-2">
                <button 
                  id="price-btn" 
                  class="px-3 py-1 rounded-md text-sm bg-blue-600 text-white"
                >
                  Price
                </button>
                <button 
                  id="volume-btn" 
                  class="px-3 py-1 rounded-md text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Volume
                </button>
                <button 
                  id="tps-btn" 
                  class="px-3 py-1 rounded-md text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  TPS
                </button>
              </div>
            </div>
            <div id="sui-chart-container" class="h-64 bg-slate-800 rounded-lg">
              <canvas id="sui-chart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Sui Ecosystem Movers</h3>
          <div class="space-y-3">
            ${marketData?.topGainers?.map((gainer: any) => `
              <div class="flex justify-between items-center">
                <span class="text-sm text-white">${gainer.token}</span>
                <span class="text-sm ${gainer.change >= 0 ? 'text-green-400' : 'text-red-400'}">
                  ${gainer.change >= 0 ? '+' : ''}${gainer.change}%
                </span>
              </div>
            `).join('') || '<p class="text-slate-400">Loading...</p>'}
          </div>
        </div>
      </div>
      
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Sui DeFi Protocols</h3>
        <div class="grid md:grid-cols-3 gap-4">
          ${this.getStakingOptions().map(protocol => `
            <div class="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
              <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-white">${protocol.name}</h4>
                <span class="text-xs px-2 py-1 rounded-full ${
                  protocol.risk === 'low' ? 'bg-green-500/20 text-green-400' :
                  protocol.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }">
                  ${protocol.risk} risk
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-400">TVL</span>
                  <span class="text-white">${protocol.tvl}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">APY</span>
                  <span class="text-green-400">${protocol.apy}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Chart.js library -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
      
      <!-- Initialize chart -->
      ${chartScript}
    </div>
  `;
}

  private async fetchMarketData(): Promise<void> {
    // Simulate API call for market data
    setTimeout(() => {
      const mockData: MarketData = {
        suiPrice: 3.45,
        suiPriceChange24h: 5.67,
        totalTVL: '$2.1B',
        topGainers: [
          { token: 'CETUS', change: 12.5 },
          { token: 'TURBOS', change: 8.3 },
          { token: 'BLUEMOVE', change: 6.7 }
        ]
      };
      this.appState.update('marketData', mockData);
    }, 1000);
  }

 
  private getStakingOptions(): StakingOption[] {
    return [
      {
        rank: 1,
        name: 'Cetus Finance',
        type: 'Liquidity Pool',
        apy: '12.5%',
        risk: 'medium',
        color: 'blue',
        tvl: '$450M',
        description: 'Automated liquidity protocol'
      },
      {
        rank: 2,
        name: 'Suistake Protocol',
        type: 'Validator Staking',
        apy: '8.2%',
        risk: 'low',
        color: 'green',
        tvl: '$380M',
        description: 'Native SUI staking'
      },
      {
        rank: 3,
        name: 'Aftermath Finance',
        type: 'Yield Aggregator',
        apy: '15.8%',
        risk: 'medium',
        color: 'purple',
        tvl: '$280M',
        description: 'Auto-compounding vaults'
      },
      {
        rank: 4,
        name: 'Turbos Finance',
        type: 'DEX LP',
        apy: '18.3%',
        risk: 'high',
        color: 'orange',
        tvl: '$320M',
        description: 'Concentrated liquidity'
      },
      {
        rank: 5,
        name: 'BlueMove',
        type: 'NFT Staking',
        apy: '22.1%',
        risk: 'high',
        color: 'red',
        tvl: '$120M',
        description: 'NFT liquidity pools'
      }
    ];
  }
  
  private renderLearnView(): string {
    return `
      <div class="max-w-4xl mx-auto">
        <div class="space-y-6">
          <div class="card p-6">
            <h2 class="text-2xl font-bold text-white mb-6">Learn DeFi on Sui</h2>
            
            <div class="grid md:grid-cols-2 gap-4 mb-6">
              <button class="p-4 bg-gradient-to-r from-blue-600/20 to-blue-600/10 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-blue-600/20 transition-all text-left">
                <h3 class="font-semibold text-white mb-2">🎓 Beginner Guide</h3>
                <p class="text-sm text-slate-400">Start your DeFi journey with basics</p>
              </button>
              
              <button class="p-4 bg-gradient-to-r from-purple-600/20 to-purple-600/10 border border-purple-500/30 rounded-lg hover:from-purple-600/30 hover:to-purple-600/20 transition-all text-left">
                <h3 class="font-semibold text-white mb-2">🚀 Advanced Strategies</h3>
                <p class="text-sm text-slate-400">Master complex yield farming</p>
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                <div class="flex items-start">
                  <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <span class="text-white font-bold">1</span>
                  </div>
                  <div class="flex-grow">
                    <h4 class="font-semibold text-white mb-2">What is DeFi?</h4>
                    <p class="text-sm text-slate-400">Understanding decentralized finance fundamentals</p>
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                <div class="flex items-start">
                  <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <span class="text-white font-bold">2</span>
                  </div>
                  <div class="flex-grow">
                    <h4 class="font-semibold text-white mb-2">Understanding Liquidity Pools</h4>
                    <p class="text-sm text-slate-400">How to provide liquidity and earn trading fees</p>
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                <div class="flex items-start">
                  <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <span class="text-white font-bold">3</span>
                  </div>
                  <div class="flex-grow">
                    <h4 class="font-semibold text-white mb-2">Impermanent Loss Explained</h4>
                    <p class="text-sm text-slate-400">Risks and mitigation strategies for LPs</p>
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                <div class="flex items-start">
                  <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <span class="text-white font-bold">4</span>
                  </div>
                  <div class="flex-grow">
                    <h4 class="font-semibold text-white mb-2">Yield Farming Strategies</h4>
                    <p class="text-sm text-slate-400">Maximize returns with compound strategies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-white mb-4">📚 Resources</h3>
              <ul class="space-y-3 text-sm">
                <li>
                  <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">Sui Documentation</a>
                </li>
                <li>
                  <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">DeFi Glossary</a>
                </li>
                <li>
                  <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">Video Tutorials</a>
                </li>
              </ul>
            </div>
            
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-white mb-4">🎯 Practice</h3>
              <p class="text-sm text-slate-400 mb-4">Test your knowledge with our simulator</p>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors w-full">
                Start Practice Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderNotifications(): string {
    return `
      <div id="notifications" class="fixed bottom-4 right-4 z-50">
        <!-- Notifications will be appended here -->
      </div>
    `;
  }

  // Add this method to render mobile navigation
private renderMobileNav(): string {
  const currentView = this.appState.get('currentView');
  const isMobileMenuOpen = this.appState.get('isMobileMenuOpen') || false;
  
  return `
    <div class="md:hidden">
      <!-- Mobile Header -->
      <div class="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
        <div class="flex items-center space-x-3">
          <img src="/logo.svg" alt="SuiChain GPT" class="h-8 w-8">
          <span class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            SuiChain GPT
          </span>
        </div>
        
        <!-- Hamburger Menu Button -->
        <button class="mobile-menu-toggle p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}" />
          </svg>
        </button>
      </div>
      
      <!-- Mobile Navigation Menu -->
      <div class="mobile-nav ${isMobileMenuOpen ? 'block' : 'hidden'} bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50">
        <nav class="p-4">
          <ul class="space-y-2">
            ${this.navItems.map(item => `
              <li>
                <a href="#" 
                   class="nav-link mobile-nav-link flex items-center p-3 rounded-lg transition-all ${
                     currentView === item.view 
                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                     : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                   }"
                   data-view="${item.view}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 ${
                    currentView === item.view ? 'text-white' : 'text-slate-400'
                  }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
                  </svg>
                  <span>${item.label}</span>
                  ${item.badge ? `
                    <span class="ml-auto text-xs px-2 py-1 rounded-full ${
                      item.badge === 'New' ? 'bg-green-500 text-white' : 'bg-slate-600 text-white'
                    }">${item.badge}</span>
                  ` : ''}
                </a>
              </li>
            `).join('')}
          </ul>
        </nav>
      </div>
    </div>
  `;
}


  private attachEventListeners(): void {
  // Use event delegation for better handling
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Handle navigation links (both desktop and mobile)
    const navLink = target.closest('.nav-link');
    if (navLink) {
      e.preventDefault();
      const view = navLink.getAttribute('data-view');
      if (view) {
        this.appState.update('currentView', view);
        // Close mobile menu after navigation
        this.appState.update('isMobileMenuOpen', false);
      }
    }
    
    // Handle mobile menu toggle
    const menuToggle = target.closest('.mobile-menu-toggle');
    if (menuToggle) {
      e.preventDefault();
      const isOpen = this.appState.get('isMobileMenuOpen') || false;
      this.appState.update('isMobileMenuOpen', !isOpen);
    }
    
    // Handle connect wallet button
    if (target.id === 'connect-wallet' || target.closest('#connect-wallet')) {
      this.connectWallet();
    }
    
    // Handle connect wallet prompt
    if (target.id === 'connect-wallet-prompt' || target.closest('#connect-wallet-prompt')) {
      this.connectWallet();
    }
    
    // Handle run simulation button
    if (target.id === 'run-simulation' || target.closest('#run-simulation')) {
      this.runSimulation();
    }
  });
}


  private async connectWallet(): Promise<void> {
    // Simulate wallet connection
    this.showNotification('Connecting wallet...', 'info');
    
    setTimeout(() => {
      this.appState.update('walletConnected', true);
      this.appState.update('userAddress', '0x1234...5678');
      this.showNotification('Wallet connected successfully!', 'success');
    }, 1500);
  }

  private async runSimulation(): Promise<void> {
    const amountInput = document.getElementById('investment-amount') as HTMLInputElement;
    const timeframeSelect = document.getElementById('timeframe') as HTMLSelectElement;
    const strategyRadio = document.querySelector('input[name="strategy"]:checked') as HTMLInputElement;
    const autoCompound = document.getElementById('auto-compound') as HTMLInputElement;

    if (!amountInput.value || !strategyRadio) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }

    const params: SimulationParams = {
      amount: parseFloat(amountInput.value),
      timeframe: timeframeSelect.value,
      strategy: strategyRadio.value,
      compounding: autoCompound.checked
    };

    this.showNotification('Running simulation...', 'info');

    // Simulate API call
    setTimeout(() => {
      const results = this.calculateSimulation(params);
      this.appState.update('simulationResults', results);
      this.showNotification('Simulation complete!', 'success');
    }, 1500);
  }

  private calculateSimulation(params: SimulationParams): SimulationResult {
    const stakingOption = this.getStakingOptions().find(opt => opt.name === params.strategy);
    const apyRate = parseFloat(stakingOption?.apy.replace('%', '') || '10') / 100;
    const months = parseInt(params.timeframe);
    
    let currentBalance = params.amount;
    const monthlyBreakdown = [];
    
    for (let i = 1; i <= months; i++) {
      const monthlyRate = apyRate / 12;
      const earnings = currentBalance * monthlyRate;
      currentBalance += earnings;
      
      monthlyBreakdown.push({
        month: `Month ${i}`,
        balance: currentBalance,
        earnings: earnings
      });
    }
    
    return {
      initialAmount: params.amount,
      finalAmount: currentBalance,
      profit: currentBalance - params.amount,
      roi: ((currentBalance - params.amount) / params.amount * 100),
      monthlyBreakdown
    };
  }

 

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notificationContainer = document.getElementById('notifications');
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-slide-in`;
    
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };

    notification.innerHTML = `
      <div class="flex items-center p-4 rounded-lg shadow-lg ${colors[type]} text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          ${type === 'success' ? 
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' :
            type === 'error' ?
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' :
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('animate-slide-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SuichainApp();

});