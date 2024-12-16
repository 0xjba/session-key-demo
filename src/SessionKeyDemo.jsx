import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const SessionKeyDemo = () => {
  const [account, setAccount] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [sessionKeyBalance, setSessionKeyBalance] = useState('0');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('');

  const SESSION_RPC = 'https://uat-testnet.ten.xyz/v1/join/';
  const GATEWAY_RPC = 'https://uat-testnet.ten.xyz/v1/?token=c866f259b62f38f9d6a495cf76510b0de030a44d';

  const MSG_ID = 1;

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        setStatus('Wallet connected');
      } else {
        setStatus('Please install MetaMask');
      }
    } catch (error) {
      setStatus('Error connecting wallet: ' + error.message);
    }
  };

  const createSessionKey = async () => {
    try {
      const response = await fetch(GATEWAY_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'sessionkeys_create',
          params: [],
          id: MSG_ID
        })
      });
      
      const rawResponse = await response.text();
      console.log("Raw create response:", rawResponse);
  
      if (rawResponse && rawResponse.length === 40) {
        const sessionKeyAddress = '0x' + rawResponse;
        setSessionKey(sessionKeyAddress);
        setStatus('Session key created: ' + sessionKeyAddress);
      } else {
        try {
          const data = JSON.parse(rawResponse);
          if (data.result) {
            setSessionKey(data.result);
            setStatus('Session key created: ' + data.result);
          } else if (data.error) {
            setStatus('Error: ' + data.error.message);
          }
        } catch {
          setStatus('Unexpected response format');
        }
      }
    } catch (error) {
      setStatus('Error creating session key: ' + error.message);
    }
  };

  const activateSessionKey = async () => {
    
    try {
      const response = await fetch(GATEWAY_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'sessionkeys_activate',
          params: [],
          id: MSG_ID
        })
      });
      
      const rawResponse = await response.text();
      console.log("Raw activate response:", rawResponse);
  
      if (response.ok) {
        setIsSessionActive(true);
        setStatus('Session key activated. Result: ' + rawResponse);
      } else {
        setStatus('Error activating: ' + rawResponse);
        setIsSessionActive(false);
      }
    } catch (error) {
      setStatus('Error activating session key: ' + error.message);
      setIsSessionActive(false);
    }
    
   /*
        try {
          const response = await fetch(GATEWAY_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getStorageAt',
              params: ['0x0000000000000000000000000000000000000004'],
              id: MSG_ID
            })
          });
          
          const rawResponse = await response.text();
          console.log("Raw activate response:", rawResponse);
      
          if (response.ok) {
            setIsSessionActive(true);
            setStatus('Session key activated through storage read. Result: ' + rawResponse);
          } else {
            setStatus('Error activating: ' + rawResponse);
            setIsSessionActive(false);
          }
        } catch (error) {
          setStatus('Error activating session key: ' + error.message);
          setIsSessionActive(false);
        }
        */
  };  

  const deactivateSessionKey = async () => {
    try {
      const response = await fetch(GATEWAY_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'sessionkeys_deactivate',
          params: [],
          id: MSG_ID
        })
      });
      
      if (response.ok) {
        const result = await response.text();
        setIsSessionActive(false);
        setSessionKey('');
        setStatus('Session key deactivated. ' + result);
      } else {
        const error = await response.text();
        setStatus('Error: ' + error);
      }
    } catch (error) {
      setStatus('Error deactivating session key: ' + error.message);
    }
  };

  const fundSessionKey = async () => {
    try {
      if (!sessionKey) {
        setStatus('No session key available');
        return;
      }
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check chain ID first
      const network = await provider.getNetwork();
      console.log("Current network:", network); // Debug log
  
      const signer = provider.getSigner();
  
      // Include chainId and explicit gasLimit in the transaction
      const tx = await signer.sendTransaction({
        to: sessionKey,
        value: ethers.utils.parseEther("0.1"),
        chainId: network.chainId,
        gasLimit: 21000
      });
  
      setStatus('Funding transaction sent, waiting for confirmation...');
      
      await tx.wait();
      setStatus('Funding transaction confirmed!');
  
    } catch (error) {
      setStatus('Error funding session key: ' + error.message);
    }
  };

  const sendTestTransaction = async () => {
    try {
      if (!isSessionActive || !sessionKey) {
        setStatus('Session key not active or not available');
        return;
      }
  
      console.log("Using session key for transaction:", sessionKey);
  
      const unsignedTx = {
        from: sessionKey,
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        value: '0x16345785D8A0000',
        gas: '0x5208',
      };
  
      const response = await fetch(GATEWAY_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [unsignedTx],
          id: MSG_ID
        })
      });
  
      if (response.ok) {
        const result = await response.text();
        setStatus('Test transaction sent: ' + result);
      } else {
        const error = await response.text();
        setStatus('Error: ' + error);
      }
    } catch (error) {
      setStatus('Error sending test transaction: ' + error.message);
    }
  };

  const checkSessionKeyBalance = async () => {
    if (!sessionKey || !window.ethereum) return;
    
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [sessionKey, 'latest']
      });
      
      const balanceInEth = parseInt(balance, 16) / 1e18;
      setSessionKeyBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  useEffect(() => {
    let interval;
    if (isSessionActive && sessionKey) {
      interval = setInterval(checkSessionKeyBalance, 5000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionKey]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Session Key Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={connectWallet}
          disabled={!!account}
          style={{ marginRight: '10px' }}
        >
          {account ? 'Connected' : 'Connect Wallet'}
        </button>
        {account && <span>Account: {account}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={createSessionKey}
          disabled={!account || !!sessionKey}
          style={{ marginRight: '10px' }}
        >
          Create Session Key
        </button>
        {sessionKey && (
          <div style={{ wordBreak: 'break-all', padding: '10px', background: '#f5f5f5', marginTop: '10px' }}>
            Session Key: {sessionKey}
          </div>
        )}
      </div>

      {sessionKey && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={activateSessionKey}
              disabled={isSessionActive}
              style={{ marginRight: '10px' }}
            >
              Activate
            </button>
            <button
              onClick={deactivateSessionKey}
              disabled={!isSessionActive}
              style={{ marginRight: '10px' }}
            >
              Deactivate
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p>Session Key Balance: {sessionKeyBalance} ETH</p>
            <button
              onClick={fundSessionKey}
              disabled={!isSessionActive}
              style={{ marginRight: '10px' }}
            >
              Fund Session Key (0.01 ETH)
            </button>
          </div>

          <button
            onClick={sendTestTransaction}
            disabled={!isSessionActive}
          >
            Send Test Transaction
          </button>
        </>
      )}

      {status && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default SessionKeyDemo;