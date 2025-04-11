import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Paper,
  Typography,
  SelectChangeEvent,
  Box,
  CircularProgress,
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import axios from 'axios';

interface VisualizationResponse {
  type: string;
  content: string;
}

interface SampleCodes {
  python: {
    static: string;
    interactive: string;
    '3d': string;
  };
  r: {
    static: string;
    interactive: string;
    '3d': string;
  };
}

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 200,
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1.5, 4),
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const EditorWrapper = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  '& .monaco-editor': {
    padding: theme.spacing(1),
  },
}));

const VisualizationWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 400,
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2),
}));

const ErrorMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  backgroundColor: theme.palette.error.light,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(2),
}));

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  fontWeight: 600,
}));

const SAMPLE_CODES: SampleCodes = {
  python: {
    static: `import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', label='sin(x)')
plt.title('Static Plot Example')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.legend()`,
    interactive: `import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

fig = px.line(x=x, y=y, title='Interactive Plot Example')
fig.update_layout(
    xaxis_title='x',
    yaxis_title='sin(x)',
    showlegend=True
)`,
    '3d': `import numpy as np

x = np.linspace(-5, 5, 50)
y = np.linspace(-5, 5, 50)
X, Y = np.meshgrid(x, y)
Z = np.sin(np.sqrt(X**2 + Y**2))

fig = go.Figure(data=[go.Surface(z=Z, x=x, y=y)])
fig.update_layout(
    title='3D Surface Plot',
    scene=dict(
        xaxis_title='X',
        yaxis_title='Y',
        zaxis_title='Z'
    )
)`
  },
  r: {
    static: `x <- seq(0, 10, length.out = 100)
y <- sin(x)
df <- data.frame(x = x, y = y)

p <- ggplot(df, aes(x = x, y = y)) +
  geom_line(color = "blue") +
  labs(title = "Static Plot Example",
       x = "x",
       y = "sin(x)") +
  theme_minimal()`,
    interactive: `x <- seq(0, 10, length.out = 100)
y <- sin(x)
df <- data.frame(x = x, y = y)

p <- plot_ly(data = df, x = ~x, y = ~y, type = 'scatter', mode = 'lines')
p$x$layout <- list(
  title = 'Interactive Plot Example',
  xaxis = list(title = 'x'),
  yaxis = list(title = 'sin(x)'),
  width = 800,
  height = 600
)`,
    '3d': `library(plotly)

x <- seq(-5, 5, length.out = 50)
y <- seq(-5, 5, length.out = 50)
grid <- expand.grid(x = x, y = y)
grid$z <- sin(sqrt(grid$x^2 + grid$y^2))

z_matrix <- matrix(grid$z, nrow = 50, ncol = 50)
x_vec <- unique(grid$x)
y_vec <- unique(grid$y)

p <- plot_ly(type = 'surface',
            x = x_vec,
            y = y_vec,
            z = z_matrix,
            colorscale = 'Viridis')
p$x$layout <- list(
  title = '3D Surface Plot',
  scene = list(
    xaxis = list(title = 'X'),
    yaxis = list(title = 'Y'),
    zaxis = list(title = 'Z')
  ),
  width = 800,
  height = 600
)`
  }
};

const VisualizationEditor: React.FC = () => {
  const [language, setLanguage] = useState<keyof SampleCodes>('python');
  const [vizType, setVizType] = useState<keyof SampleCodes['python']>('static');
  const [code, setCode] = useState<string>(SAMPLE_CODES[language][vizType]);
  const [visualization, setVisualization] = useState<string>('');
  const [visualizationType, setVisualizationType] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (visualization && visualizationType === 'html') {
        URL.revokeObjectURL(visualization);
      }
    };
  }, [visualization, visualizationType]);

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLanguage = event.target.value as keyof SampleCodes;
    setLanguage(newLanguage);
    setCode(SAMPLE_CODES[newLanguage][vizType]);
  };

  const handleVizTypeChange = (event: SelectChangeEvent) => {
    const newType = event.target.value as keyof SampleCodes['python'];
    setVizType(newType);
    setCode(SAMPLE_CODES[language][newType]);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const generateVisualization = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setVisualization('');
    setVisualizationType('');
    
    try {
      const response = await axios.post<VisualizationResponse>('http://localhost:8000/generate-visualization', {
        code,
        language,
        viz_type: vizType
      });
      
      if (response.data.type === 'image') {
        setVisualizationType('image');
        setVisualization(response.data.content);
      } else if (response.data.type === 'html') {
        setVisualizationType('html');
        setVisualization(response.data.content);
      } else {
        setError('No visualization was generated');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="lg">
      <Title variant="h4" gutterBottom>
        Visualization Editor
      </Title>
      
      <Stack spacing={3}>
        <StyledPaper>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="space-between" 
            alignItems="center"
          >
            <StyledFormControl>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                label="Language"
                onChange={handleLanguageChange}
              >
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="r">R</MenuItem>
              </Select>
            </StyledFormControl>
            
            <StyledFormControl>
              <InputLabel>Visualization Type</InputLabel>
              <Select
                value={vizType}
                label="Visualization Type"
                onChange={handleVizTypeChange}
              >
                <MenuItem value="static">Static</MenuItem>
                <MenuItem value="interactive">Interactive</MenuItem>
                <MenuItem value="3d">3D</MenuItem>
              </Select>
            </StyledFormControl>
            
            <StyledButton
              variant="contained"
              onClick={generateVisualization}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Generating...' : 'Generate Visualization'}
            </StyledButton>
          </Stack>
        </StyledPaper>

        <StyledPaper>
          <EditorWrapper>
            <Editor
              height="400px"
              defaultLanguage={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </EditorWrapper>
        </StyledPaper>

        {error && (
          <ErrorMessage variant="body1">
            {error}
          </ErrorMessage>
        )}

        {visualization && (
          <StyledPaper>
            <VisualizationWrapper>
              {visualizationType === 'image' ? (
                <img 
                  src={`data:image/png;base64,${visualization}`} 
                  alt="Visualization" 
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '600px',
                    objectFit: 'contain',
                  }} 
                />
              ) : (
                <Box sx={{ width: '100%', height: '600px', position: 'relative' }}>
                  <iframe
                    srcDoc={visualization}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%', 
                      height: '100%', 
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    title="Interactive Visualization"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    scrolling="no"
                  />
                </Box>
              )}
            </VisualizationWrapper>
          </StyledPaper>
        )}
      </Stack>
    </StyledContainer>
  );
};

export default VisualizationEditor; 