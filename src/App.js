import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import './App.css';

const TenantId = '37700e73-f4ab-40b3-823e-9a13d078da53';
const ClientId = '986386c6-682e-45fe-92d1-18b9eba7d6e1';

const msalConfig = {
  auth: {
    clientId: ClientId,
    authority: `https://login.microsoftonline.com/${TenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};

const pca = new PublicClientApplication(msalConfig);

function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [botResponse, setBotResponse] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  console.log(accessToken)
  useEffect(() => {
    const initializeMSAL = async () => {
      try {
        // Check if MSAL has been initialized
        if (!pca.isInitialized()) {
          await pca.initialize();
        }
  
        const accounts = pca.getAllAccounts();
        if (accounts.length > 0) {
          // User is already logged in
          setIsLoggedIn(true);
  
          // Try to acquire an access token silently
          pca.acquireTokenSilent({
            account: accounts[0],
            scopes: [
              'https://analysis.windows.net/powerbi/api/Dataset.Read.All',
              'https://analysis.windows.net/powerbi/api/Report.Read.All',
            ],
          })
            .then((response) => {
              setAccessToken(response.accessToken);
            })
            .catch((error) => {
              console.error('Error acquiring access token silently:', error);
              // Handle the error appropriately
            });
        }
      } catch (error) {
        console.error('Error initializing MSAL:', error);
        // Handle the error appropriately
      }
    };
  
    initializeMSAL();
  }, []);
  const handleLogin = async () => {
    try {
      // Ensure that the application is initialized before calling loginPopup
      await pca.initialize();
      const loginResponse = await pca.loginPopup();
      if (loginResponse) {
        setIsLoggedIn(true);
        // After login, get the access token
        const accounts = pca.getAllAccounts();
        const accessTokenResponse = await pca.acquireTokenSilent({
          account: accounts[0],
          scopes: [
            'https://analysis.windows.net/powerbi/api/Dataset.Read.All',
            'https://analysis.windows.net/powerbi/api/Report.Read.All',
          ],
        });
        setAccessToken(accessTokenResponse.accessToken);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };
  
  
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleSendMessage = async () => {
    if (userInput.trim() === '') return;

    // Display user input as a user message
    setMessages([...messages, { type: 'user', text: userInput }]);
  
    // Display loading message before sending user input to Flask API
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'loading', text: 'Loading...' },
    ]);
  
    // Send user input to Flask API
    const response = await fetch('http://127.0.0.1:5000/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: userInput,
        accessToken: accessToken,
      }),
    });
    // Check if the request was successful (status code 200)
if (response.ok) {
  // Parse the JSON response
  const data = await response.json();
  const daxquery = data.daxquery
  // Assuming bot's response contains 'tables' key
  if (data.result && data.result.results.length > 0 && data.result.results[0].tables) {
    // Extract the table rows and headers from the response
    const tableRows = data.result.results[0].tables[0].rows;
    const tableHeaders = Object.keys(tableRows[0]);

    // Add bot's table response to messages
    setMessages((prevMessages) => [
      ...prevMessages.slice(0, -1), // Remove the loading message
      {
        type: 'bot',
        text: (
          <div className="bot-response-table" style={{overflow:'auto'}}>
            <table>
              <thead>
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {tableHeaders.map((header, colIndex) => (
                      <td key={colIndex}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          
            <p className='dax-query'><span className='dax-query-title'>Generated Dax Query: </span>{daxquery}</p>
          </div>
        ),
      },
    ]);
  } else {
    // Handle the case when the response does not contain the expected structure
    console.error('Unexpected response structure from the bot.');
  }
    }
  
    // Clear the input field
    setUserInput('');
  };
  const handleClearChat = () => {
    setMessages([]);
    setBotResponse(null);
  };

  return (
    <>
      {isLoggedIn ? (
        <div className="chat-container">
          <div className="chat-messages">
            {/* Render user and bot messages */}
            {messages.map((message, index) => (
              <div key={index} className={message.type === 'user' ? 'user-message' : 'bot-message'}>
                {/* Render bot's table response if available */}
                {message.type === 'bot' && message.text}
                {/* Render user message as plain text */}
                {message.type === 'user' && <div>{message.text}</div>}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSendMessage();
                }
              }}
                
            />
            <button onClick={handleSendMessage}>Send</button>
            <button onClick={handleClearChat}>Clear</button>
          </div>
        </div>
      ) : (
        <div>
          <h2>Please log in</h2>
          <button onClick={handleLogin}>Log in</button>
        </div>
      )}
    </>
  );
}

export default App;
