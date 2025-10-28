import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Mic,
  Stop,
  Warning,
  CheckCircle,
  Error,
  Phone,
  VolumeUp,
  Close,
  Upload,
  Psychology
} from '@mui/icons-material';

const VoiceScamDetector = () => {
  const [transcription, setTranscription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-show critical warning dialog
  useEffect(() => {
    if (results && results.threat_level === 'critical') {
      setShowWarningDialog(true);
      // Play alert sound (optional)
      playAlertSound();
    }
  }, [results]);

  const playAlertSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const handleAnalyzeText = async () => {
    if (!transcription.trim()) {
      setError('Please enter call transcription to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:80/api/analyze-voice-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: transcription.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze call');
      }

      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the call');
    } finally {
      setAnalyzing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        handleAnalyzeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioChunks([]);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleAnalyzeAudio = async (audioBlob) => {
    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.wav');

      const response = await fetch('http://localhost:80/api/analyze-voice-audio', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze audio');
      }

      setResults(data);

      // Also set the transcription in the text field
      if (data.transcription) {
        setTranscription(data.transcription);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the audio');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|m4a|ogg)$/i)) {
      setError('Please upload a valid audio file (WAV, MP3, M4A, or OGG)');
      return;
    }

    handleAnalyzeAudio(file);
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', padding: 3 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Phone sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1">
              Voice Scam Detector
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Detect scam patterns in phone calls in real-time. Use your speakerphone, paste a transcription,
            or upload a recording to identify manipulation tactics and fake tech support scams.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Recording Controls */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Mic sx={{ mr: 1 }} />
              Live Recording
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              {!isRecording ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Mic />}
                  onClick={startRecording}
                  size="large"
                >
                  Start Recording
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Stop />}
                  onClick={stopRecording}
                  size="large"
                >
                  Stop & Analyze
                </Button>
              )}

              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                disabled={isRecording}
              >
                Upload Audio File
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={handleFileUpload}
                />
              </Button>
            </Stack>

            {isRecording && (
              <Alert severity="info" icon={<VolumeUp />}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Recording in progress... Speak clearly or play the call on speakerphone
                </Typography>
                <LinearProgress sx={{ mt: 1 }} />
              </Alert>
            )}

            {analyzing && (
              <Alert severity="info">
                <Typography variant="body2">
                  Analyzing audio with AI... This may take a moment
                </Typography>
                <LinearProgress sx={{ mt: 1 }} />
              </Alert>
            )}
          </Paper>

          {/* Text Input Section */}
          <Stack spacing={2}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Psychology sx={{ mr: 1 }} />
              Or Enter Call Transcription
            </Typography>

            <TextField
              fullWidth
              label="Call Transcription"
              placeholder="Enter what the caller said, or paste a call transcript here..."
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              variant="outlined"
              multiline
              rows={6}
              disabled={isRecording}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleAnalyzeText}
              disabled={analyzing || !transcription.trim() || isRecording}
              startIcon={analyzing ? <CircularProgress size={20} /> : <Psychology />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Call'}
            </Button>
          </Stack>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          {/* Results Display */}
          {results && (
            <Box sx={{ mt: 4 }}>
              {/* Threat Level Alert */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: results.is_suspicious ? 'error.light' : 'success.light',
                  border: 3,
                  borderColor: results.is_suspicious ? 'error.main' : 'success.main'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: results.is_suspicious ? 'error.dark' : 'success.dark' }}>
                    {results.is_suspicious ? (
                      <Error sx={{ fontSize: 60 }} />
                    ) : (
                      <CheckCircle sx={{ fontSize: 60 }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {results.is_suspicious ? '⚠️ SCAM DETECTED' : '✅ No Scam Detected'}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`Threat Level: ${results.threat_level.toUpperCase()}`}
                        color={getThreatLevelColor(results.threat_level)}
                        sx={{ fontWeight: 'bold' }}
                      />
                      {results.confidence > 0 && (
                        <Chip
                          label={`Confidence: ${results.confidence}%`}
                          variant="outlined"
                        />
                      )}
                      {results.scam_type && (
                        <Chip
                          label={results.scam_type.replace(/_/g, ' ').toUpperCase()}
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>

                {results.immediate_action && (
                  <Alert severity="error" sx={{ mt: 2, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {results.immediate_action}
                  </Alert>
                )}
              </Paper>

              {/* Detected Phrases */}
              {results.detected_phrases && results.detected_phrases.length > 0 && (
                <Card variant="outlined" sx={{ mb: 2, borderColor: 'error.main', borderWidth: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                      🚩 Detected Scam Phrases:
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {results.detected_phrases.map((phrase, index) => (
                        <Chip
                          key={index}
                          label={phrase}
                          color="error"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Warning Indicators */}
              {results.warning_indicators && Object.keys(results.warning_indicators).length > 0 && (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Warning Indicators:
                    </Typography>
                    <List dense>
                      {Object.entries(results.warning_indicators).map(([key, value]) => {
                        if (value > 0) {
                          return (
                            <ListItem key={key}>
                              <ListItemIcon>
                                <Warning color="error" />
                              </ListItemIcon>
                              <ListItemText
                                primary={`${key.replace(/_/g, ' ').toUpperCase()}: ${value}`}
                              />
                            </ListItem>
                          );
                        }
                        return null;
                      })}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {results.recommendations && results.recommendations.length > 0 && (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      What You Should Do:
                    </Typography>
                    <List>
                      {results.recommendations.map((rec, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{
                              variant: 'body1',
                              sx: { fontSize: '1.1rem' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Transcription Display */}
              {results.transcription && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Call Transcription:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {results.transcription}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Critical Warning Dialog */}
      <Dialog
        open={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'error.light',
            border: 3,
            borderColor: 'error.main'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Error sx={{ fontSize: 40, mr: 2, color: 'error.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              ⚠️ SCAM ALERT!
            </Typography>
          </Box>
          <IconButton onClick={() => setShowWarningDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, fontSize: '1.1rem' }}>
            {results?.immediate_action || 'This call shows signs of being a scam!'}
          </Alert>
          <Typography variant="body1" paragraph>
            Our analysis has detected critical scam indicators in this call. Please:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="1. Hang up the phone immediately" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Do NOT provide any personal information" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Do NOT send money or gift cards" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Block this number" />
            </ListItem>
            <ListItem>
              <ListItemText primary="5. Report to FTC at reportfraud.ftc.gov" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowWarningDialog(false)}
            variant="contained"
            color="error"
            size="large"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Information Card */}
      <Card sx={{ mt: 3 }} variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How It Works:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="Record calls on speakerphone or upload audio files" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="AI analyzes speech patterns for manipulation tactics" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="Detects fake tech support, IRS scams, and more" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="Get real-time warnings before it's too late" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VoiceScamDetector;
