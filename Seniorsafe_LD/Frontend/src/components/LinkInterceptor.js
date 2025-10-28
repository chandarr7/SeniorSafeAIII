import React, { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  Shield,
  BugReport,
  Info,
  Link as LinkIcon
} from '@mui/icons-material';

const LinkInterceptor = () => {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

  const getThreatLevelIcon = (level) => {
    switch (level) {
      case 'critical':
        return <Error fontSize="large" />;
      case 'high':
        return <Warning fontSize="large" />;
      case 'medium':
        return <Security fontSize="large" />;
      case 'low':
        return <CheckCircle fontSize="large" />;
      default:
        return <Info fontSize="large" />;
    }
  };

  const handleScanLink = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to scan');
      return;
    }

    setScanning(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:80/api/scan-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan link');
      }

      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred while scanning the link');
    } finally {
      setScanning(false);
    }
  };

  const handlePaste = async (e) => {
    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    setUrl(pastedText);

    // Automatically scan if it looks like a URL
    if (pastedText.includes('http') || pastedText.includes('www.')) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleScanLink();
      }, 100);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', padding: 3 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Shield sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1">
              Live Link Interceptor
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Paste any suspicious link or email, and we'll scan it instantly using multiple threat intelligence sources
            including Google Safe Browsing, VirusTotal, and AI analysis.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Input Section */}
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Enter or Paste URL"
              placeholder="https://example.com or paste suspicious link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={handlePaste}
              variant="outlined"
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScanLink();
                }
              }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleScanLink}
              disabled={scanning || !url.trim()}
              startIcon={scanning ? <CircularProgress size={20} /> : <Security />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {scanning ? 'Scanning...' : 'Scan Link Now'}
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
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: results.is_safe ? 'success.light' : 'error.light',
                  border: 2,
                  borderColor: results.is_safe ? 'success.main' : 'error.main'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: results.is_safe ? 'success.dark' : 'error.dark' }}>
                    {getThreatLevelIcon(results.threat_level)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {results.is_safe ? '✅ Link Appears Safe' : '⚠️ Threat Detected'}
                    </Typography>
                    <Chip
                      label={`Threat Level: ${results.threat_level.toUpperCase()}`}
                      color={getThreatLevelColor(results.threat_level)}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Scanned URL */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Scanned URL:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {results.url}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Scanned at: {new Date(results.timestamp).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>

              {/* Threats */}
              {results.threats && results.threats.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Detected Threats:
                  </Typography>
                  <List dense>
                    {results.threats.map((threat, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <BugReport color="error" />
                        </ListItemIcon>
                        <ListItemText primary={threat} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Recommendations */}
              {results.recommendations && results.recommendations.length > 0 && (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Info sx={{ mr: 1 }} />
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

              {/* Detailed Analysis */}
              {results.details && Object.keys(results.details).length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Detailed Analysis</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {results.details.pattern_analysis && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Pattern Analysis:
                          </Typography>
                          <Typography variant="body2">
                            Domain: {results.details.pattern_analysis.domain}
                          </Typography>
                          {results.details.pattern_analysis.reasons &&
                            results.details.pattern_analysis.reasons.length > 0 && (
                              <List dense>
                                {results.details.pattern_analysis.reasons.map((reason, idx) => (
                                  <ListItem key={idx}>
                                    <ListItemText primary={reason} />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                        </Box>
                      )}

                      {results.details.google_safe_browsing && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Google Safe Browsing:
                          </Typography>
                          {results.details.google_safe_browsing.threats && (
                            <Typography variant="body2">
                              Threats: {results.details.google_safe_browsing.threats.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {results.details.virustotal && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            VirusTotal Analysis:
                          </Typography>
                          <Typography variant="body2">
                            Malicious: {results.details.virustotal.malicious_count} |
                            Suspicious: {results.details.virustotal.suspicious_count} |
                            Harmless: {results.details.virustotal.harmless_count}
                          </Typography>
                        </Box>
                      )}

                      {results.details.ai_analysis && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            AI Analysis:
                          </Typography>
                          {results.details.ai_analysis.reasons && (
                            <List dense>
                              {results.details.ai_analysis.reasons.map((reason, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText primary={reason} />
                                </ListItem>
                              ))}
                            </List>
                          )}
                          {results.details.ai_analysis.confidence && (
                            <Typography variant="body2">
                              Confidence: {results.details.ai_analysis.confidence}%
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

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
              <ListItemText primary="Paste any suspicious link and we scan it instantly" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="We check against Google Safe Browsing, VirusTotal, and AI analysis" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="Get clear warnings before clicking any dangerous links" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText primary="Receive simple, actionable recommendations to stay safe" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LinkInterceptor;
