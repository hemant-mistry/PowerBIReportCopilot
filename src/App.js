import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [botResponse, setBotResponse] = useState(null);

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
    const response = await fetch('https://dualitydev.pythonanywhere.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput: userInput })  // Include user input in the request body
    });
    // Check if the request was successful (status code 200)
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
      <center><div><h1>Power BI Report Copilot</h1></div></center>
      <center>
      <div>
        <h4>
          <a href='https://app.powerbi.com/groups/aa3db8b3-856e-45ec-8399-eb558d24e69b/reports/7308046c-7e4f-48c1-8241-2512784403d5/ReportSection97d3c8eeb92a49265900?experience=power-bi'>
            Report Link
          </a>
          <span style={{ marginLeft: '10px' }}>Version 1</span>
        </h4>
      </div>
    </center>

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
          />
          <button onClick={handleSendMessage}>Send</button>
          <button onClick={handleClearChat}>Clear</button>
        </div>
      </div>
    </>
  );
}

export default App;
