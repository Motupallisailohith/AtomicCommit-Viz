// C:\Users\sailo\my-2pc-ui\src\components\LiveVisualization.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Eye, ArrowRight, ArrowLeft, Info } from 'lucide-react';
// Import only fetchTransactionMessages from apiService, TC_API_URL might not be needed here if mocked.
// Removed axios import as it's handled in apiService.
import { fetchTransactionMessages } from '../services/apiService'; // <--- Ensure this import is correct

// Use the Message and Node interfaces from your types.ts file for type safety
import { Message } from '../types'; // Assuming Message interface is in types.ts
// Node interface used internally, can be defined here or imported from types.ts
interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
}


const PHASES = [
  { type: 'PREPARE', label: 'Prepare Phase' },
  { type: 'VOTE', label: 'Voting Phase' },
  { type: 'COMMIT', label: 'Commit Phase' },
  { type: 'ABORT', label: 'Abort Phase' },
  { type: 'COMPLETE', label: 'Complete' }, // Added COMPLETE phase for visualization progress
];

const getCurrentPhase = (messages: Message[], currentTime: number) => {
  const latest = [...messages].reverse().find(m => m.timestamp <= currentTime);
  if (!latest) return PHASES[0].label; // Default to Prepare if no messages yet
  if (latest.type === 'INITIATE') return PHASES[0].label; // Client initiate
  if (latest.type === 'PREPARE') return PHASES[0].label;
  if (latest.type === 'VOTE') return PHASES[1].label;
  if (latest.type === 'COMMIT' || latest.type === 'ACK') return PHASES[2].label; // Acknowledge of commit
  if (latest.type === 'ABORT' || latest.type === 'NACK') return PHASES[3].label; // NACK for abort
  if (latest.type === 'CRASH') return "CRASHED"; // Special phase for crash visualization
  return PHASES[0].label; // Fallback
};

const getNodeStates = (nodes: Node[], messages: Message[], currentTime: number) => {
  const states: Record<string, string> = {};
  nodes.forEach(node => {
    // Find the latest message to/from this node that occurred up to currentTime
    const relevant = [...messages]
      .filter(m => (m.to === node.id || m.from === node.id) && m.timestamp <= currentTime)
      .sort((a, b) => b.timestamp - a.timestamp); // Sort descending by timestamp

    if (relevant.length === 0) {
      states[node.id] = 'Idle';
    } else {
      const last = relevant[0];
      if (last.type === 'PREPARE') states[node.id] = 'Prepared';
      else if (last.type === 'VOTE') states[node.id] = last.content; // YES/NO
      else if (last.type === 'COMMIT' || last.type === 'ACK') states[node.id] = 'Committed';
      else if (last.type === 'ABORT' || last.type === 'NACK') states[node.id] = 'Aborted';
      else if (last.type === 'CRASH' && last.from === node.id) states[node.id] = 'Crashed!'; // Node initiated crash
      else states[node.id] = last.type; // Fallback to message type
    }
  });
  return states;
};

const LiveVisualization: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Nodes for the visualization canvas (can be hardcoded for simple demo)
  const vizNodes = [
    { id: 'client', name: 'Client', x: 400, y: 50 }, // Added a Client node
    { id: 'coordinator', name: 'Coordinator', x: 400, y: 200 },
    { id: 'node1', name: 'Node 1', x: 200, y: 350 },
    { id: 'node2', name: 'Node 2', x: 600, y: 350 },
  ];

  useEffect(() => {
    setNodes(vizNodes); // Use the vizNodes for drawing
    
    const loadVisualizationData = async () => {
        try {
            // Call the mocked fetchTransactionMessages from apiService
            const data = await fetchTransactionMessages(); 
            setMessages(data);
            if (data.length > 0) {
              // Duration is the timestamp of the last message
              setDuration(data[data.length - 1].timestamp + 2000); // Add some buffer time
            }
        } catch (error) {
            console.error('Failed to fetch visualization messages (mocked):', error);
        }
    };
    loadVisualizationData(); // Load data on component mount
  }, []); // Empty dependency array means run once on mount

  // THIS useEffect is where ctx is defined and drawing happens
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // --- MOVE DRAWING FUNCTIONS HERE ---
    const drawNode = (node: Node, state: string) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = '#44475a';
      ctx.fill();
      ctx.strokeStyle = '#6272a4';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(node.x + 22, node.y - 22, 10, 0, Math.PI * 2);
      ctx.fillStyle =
        state === 'Committed'
          ? '#50fa7b'
          : state === 'Aborted'
          ? '#ff5555'
          : state === 'Prepared'
          ? '#f1fa8c'
          : '#8be9fd';
      ctx.fill();

      ctx.fillStyle = '#e6e6e6';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 50);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#282a36';
      ctx.fillText(state, node.x + 22, node.y - 18);
    };

    const drawConnection = (from: Node, to: Node, active: boolean) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = active ? '#50fa7b' : '#44475a';
      ctx.lineWidth = active ? 3 : 1;
      ctx.stroke();
    };

    const drawMessage = (message: Message, progress: number) => {
      const fromNode = nodes.find(n => n.id === message.from);
      const toNode = nodes.find(n => n.id === message.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.arc(
        fromNode.x + (toNode.x - fromNode.x) * progress,
        fromNode.y + (toNode.y - fromNode.y) * progress,
        8,
        0,
        Math.PI * 2
      );
      ctx.fillStyle =
        message.type === 'PREPARE'
          ? '#f1fa8c'
          : message.type === 'VOTE'
          ? '#8be9fd'
          : message.type === 'COMMIT'
          ? '#50fa7b'
          : message.type === 'ABORT'
          ? '#ff5555'
          : '#ff79c6';
      ctx.fill();
    };
    // --- END MOVE ---

    // Clear canvas for redrawing
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw connections (always present, style based on activity)
    vizNodes.forEach(from => {
      vizNodes.forEach(to => {
        if (from.id !== to.id) {
          // Determine if there's an active message between these two nodes at current time
          const activeMessage = messages.find(msg =>
            (msg.from === from.id && msg.to === to.id || msg.from === to.id && msg.to === from.id) &&
            (currentTime >= (msg.timestamp - 1000) && currentTime <= msg.timestamp) // Message active for 1s before its timestamp
          );
          drawConnection(from, to, !!activeMessage);
        }
      });
    });

    // Draw nodes with state
    const nodeStates = getNodeStates(vizNodes, messages, currentTime);
    vizNodes.forEach(node => {
      drawNode(node, nodeStates[node.id]);
    });

    // Draw active messages (moving circles)
    messages.forEach(message => {
      const messageActiveDuration = 1000; // Message visible for 1 second before its timestamp
      const messageStart = message.timestamp - messageActiveDuration;
      const messageEnd = message.timestamp;

      if (currentTime >= messageStart && currentTime <= messageEnd) {
        const progress = (currentTime - messageStart) / messageActiveDuration;
        drawMessage(message, progress);
      }
    });

  }, [nodes, currentTime, messages, vizNodes]); // Redraw whenever these dependencies change

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentTime(time => {
          if (time >= duration) {
            setIsPlaying(false); // Stop playing when duration is reached
            return duration;
          }
          return time + 16; // Advance time by ~16ms (approx 60fps)
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate); // Start animation frame loop
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current); // Stop animation frame loop
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current); // Cleanup on unmount
      }
    };
  }, [isPlaying, duration]); // Re-run effect if playing state or duration changes

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setCurrentTime(0); // Reset time to start
    setIsPlaying(false); // Pause
  };
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(event.target.value)); // Set time from slider
  };
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `<span class="math-inline">\{minutes\.toString\(\)\.padStart\(2, '0'\)\}\:</span>{seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const phaseLabel = getCurrentPhase(messages, currentTime);

  return (
    <div className="min-h-screen bg-terminal-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Eye className="w-8 h-8 text-terminal-accent" />
          <h1 className="text-2xl font-bold text-terminal-text">Live Protocol Visualization</h1>
        </div>
        <div className="bg-terminal-highlight rounded-lg border border-terminal-border p-6">
          <div className="mb-4 flex items-center space-x-3">
            <Info className="w-5 h-5 text-terminal-accent" />
            <span className="text-lg font-semibold text-terminal-text">{phaseLabel}</span>
          </div>
          <div className="mb-6">
            <canvas
              ref={canvasRef}
              width={800} // Increased width for client node
              height={450} // Increased height to accommodate client node
              className="w-full bg-terminal-bg rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded hover:bg-terminal-bg transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-terminal-text" />
              ) : (
                <Play className="w-6 h-6 text-terminal-text" />
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded hover:bg-terminal-bg transition-colors"
              aria-label="Reset"
            >
              <RotateCcw className="w-6 h-6 text-terminal-text" />
            </button>
            <div className="flex-1 flex items-center space-x-4">
              <span className="text-terminal-text font-mono">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-terminal-border rounded-lg appearance-none cursor-pointer"
                aria-label="Seek"
              />
              <span className="text-terminal-text font-mono">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          <div className="mt-8">
    <h2 className="text-lg font-semibold text-terminal-text mb-4">Message Log</h2>
    <div className="space-y-2 max-h-48 overflow-y-auto">
        {messages.map((message, index) => (
            <div
                key={index}
                className={`p-3 rounded ${
                    message.timestamp <= currentTime
                      ? 'bg-terminal-bg'
                      : 'bg-terminal-border/20'
                }`}
            >
                <div className="flex items-center text-sm">
                    <span className="text-terminal-accent">{message.from}</span>
                    <ArrowRight className="w-4 h-4 mx-2 text-terminal-muted" />
                    <span className="text-terminal-accent">{message.to}</span>
                    <span className="ml-4 text-terminal-text">{message.type}</span>
                    {/* FIX IS HERE: Ensure formatTime() is within { } */}
                    <span className="ml-auto text-terminal-muted">
                      {formatTime(message.timestamp)} {/* <--- THIS IS THE CRITICAL PART */}
                    </span>
                </div>
                <div className="mt-1 text-sm text-terminal-text font-mono">
                    {/* Ensure message.content doesn't have extra formatting artifacts */}
                    {message.content}
                </div>
            </div>
        ))}
    </div>
</div>
          {/* Optional: Add a legend */}
          <div className="mt-6 flex items-center space-x-6">
            <span className="text-sm text-terminal-muted">Legend:</span>
            <span className="flex items-center text-xs">
              <span className="inline-block w-4 h-4 rounded-full bg-[#f1fa8c] mr-1" /> PREPARE
            </span>
            <span className="flex items-center text-xs">
              <span className="inline-block w-4 h-4 rounded-full bg-[#8be9fd] mr-1" /> VOTE
            </span>
            <span className="flex items-center text-xs">
              <span className="inline-block w-4 h-4 rounded-full bg-[#50fa7b] mr-1" /> COMMIT
            </span>
            <span className="flex items-center text-xs">
              <span className="inline-block w-4 h-4 rounded-full bg-[#ff5555] mr-1" /> ABORT
            </span>
            <span className="flex items-center text-xs">
              <span className="inline-block w-4 h-4 rounded-full bg-gray-500 mr-1" /> CRASH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVisualization;